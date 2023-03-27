/*
Copyright 2023 Corsha.
Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package cmd

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"time"

	helm "github.com/mittwald/go-helm-client"
	log "github.com/sirupsen/logrus"
	"helm.sh/helm/v3/pkg/repo"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/portforward"
	"k8s.io/client-go/transport/spdy"
)

// cast runs kubeshark tap and deploys CAST. On exit, it will clean up
// CAST and kubeshark resources.
func cast(namespace string, port string, kubeConfigPath string, kubeContext string, noDownload, testMode bool) {
	log.Info("Namespace to be analyzed: ", namespace)

	// trap Ctrl+C and call cancel on the context
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Get (or download) Kubeshark
	kubesharkPath := getKubesharkCmd(ctx, noDownload)
	// Ensure config file exists, and get its path:
	kubesharkConfig := ensureKubesharkConfigfile()

	// Create helm client

	var kubeConfig []byte
	kubeConfig, err := os.ReadFile(kubeConfigPath)
	if err != nil {
		log.WithError(err).WithFields(log.Fields{"kubeconfig": kubeConfigPath}).Error("Error reading kubeconfig.")
		return
	}

	opt := &helm.KubeConfClientOptions{
		Options: &helm.Options{
			Namespace:        "cast",
			RepositoryCache:  "/tmp/.helmcache",
			RepositoryConfig: "/tmp/.helmrepo",
			Debug:            true,
			Linting:          true,
			DebugLog: func(format string, v ...interface{}) {
				log.Printf(format, v...)
			},
		},
		KubeContext: kubeContext,
		KubeConfig:  kubeConfig,
	}

	helmClient, err := helm.NewClientFromKubeConf(opt, helm.Burst(100), helm.Timeout(10e9))
	if err != nil {
		log.WithError(err).WithFields(log.Fields{"kubeconfig": kubeConfigPath}).Error("Error creating helm client from kubeconfig.")
		return
	}

	// Create kubernetes client

	var config *rest.Config
	config, err = clientcmd.BuildConfigFromFlags("", kubeConfigPath)
	if err != nil {
		log.WithError(err).Error("Error reading kubeconfig.")
		return
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.WithError(err).Error("Error creating clientset.")
		return
	}

	// Start kubeshark tap of namespace

	cmdConfig := fmt.Sprintf("kube-config-path=%s", kubeConfigPath)
	cmdContext := fmt.Sprintf("kube-context=%s", kubeContext)
	ksCmd := exec.CommandContext(ctx, kubesharkPath, "tap", "--configpath", kubesharkConfig, "-n", namespace, "--set", "headless=true", "--set", cmdConfig, "--set", cmdContext)

	err = ksCmd.Start()
	if err != nil {
		log.WithError(err).Fatal("Error starting kubeshark tap. ")
	}

	go func() {
		err := ksCmd.Wait()
		if err != nil {
			handleError(ctx, "Error running kubeshark tap.", err)
		}
	}()

	log.Info("Started kubeshark tap. ")

	// Helm deploy cast

	// Define a public chart repository.
	chartRepo := repo.Entry{
		Name: "corshatech",
		URL:  "https://corshatech.github.io/cast/",
	}

	// Add a chart-repository to the client.
	if err := helmClient.AddOrUpdateChartRepo(chartRepo); err != nil {
		log.WithError(err).Fatal("Error adding CAST helm repo.")
		return
	}

	log.Info("Added CAST helm chart repository.")

	// Install CAST chart release.

	defer castCleanup(helmClient, clientset, noDownload)

	go func(ctx context.Context) {
		select {
		case <-ctx.Done():
			return
		default:
			deployCast(ctx, helmClient, clientset, config, port, castChartVersion, testMode)
		}
	}(ctx)

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)

	// wait for signal interrupt
	select {
	case <-ctx.Done():
	case <-c:
		log.Info("signal: interrupt")
		cancel()
	}

}

// deployCast is a helper function that deploys the CAST helm chart.
func deployCast(ctx context.Context, helmClient helm.Client, clientset *kubernetes.Clientset, config *rest.Config, port, version string, testMode bool) {

	chartName := "corshatech/cast"
	// if testMode=true, use local chart instead of pulling from repo
	if testMode {
		chartName = "k8s/helm/cast"
		log.Info("Using local helm chart for test mode.")
	}

	chartSpec := helm.ChartSpec{
		ReleaseName:     "cast",
		Version:         version,
		CreateNamespace: true,
		ChartName:       chartName,
		Namespace:       "cast",
		UpgradeCRDs:     true,
		Wait:            true,
		Timeout:         2 * time.Minute, // postgres pod can take >30s to be ready.
	}
	if _, err := helmClient.InstallOrUpgradeChart(ctx, &chartSpec, nil); err != nil {
		handleError(ctx, "Error installing CAST helm chart.", err)
		return
	}

	log.Info("CAST release is ready.")

	// Portforward UI pod to localhost:3000

	listOptions := metav1.ListOptions{
		LabelSelector: "app=cast-ui",
	}
	pods, err := clientset.CoreV1().Pods("cast").List(ctx, listOptions)
	if err != nil {
		handleError(ctx, "Error listing pods in cast namespace.", err)
		return
	}

	if len(pods.Items) != 1 {
		handleError(ctx, fmt.Sprintf("More than 1 pod found under 'cast-ui' label. Pods: %v", pods.Items), nil)
		return
	}

	uiPod := pods.Items[0]

	// stopCh controls the port forwarding lifecycle. When it gets closed the
	// port forward will terminate
	stopCh := make(chan struct{}, 1)
	// readyCh communicates when the port forward is ready to get traffic
	readyCh := make(chan struct{})

	go func(ctx context.Context) {
		select {
		case <-ctx.Done():
			return
		default:
			err := portForward(uiPod, port, config, stopCh, readyCh)
			if err != nil {
				handleError(ctx, "Error forwarding port.", err)
				return
			}
		}
	}(ctx)

	select {
	case <-readyCh:
		fmt.Printf("Port forwarding is ready. CAST is available at http://localhost:%s/ \n", port)
		break
	case <-ctx.Done():
		close(stopCh)
	}
}

// portForward port forwards from port 3000 on the pod to 3000 on localhost
func portForward(pod v1.Pod, port string, config *rest.Config, stopCh <-chan struct{}, readyCh chan struct{}) error {
	path := fmt.Sprintf("/api/v1/namespaces/%s/pods/%s/portforward", "cast", pod.Name)
	hostIP := strings.TrimLeft(config.Host, "htps:/")

	transport, upgrader, err := spdy.RoundTripperFor(config)
	if err != nil {
		log.WithError(err).Error("Error port-forwarding.")
	}

	dialer := spdy.NewDialer(upgrader, &http.Client{Transport: transport}, http.MethodPost, &url.URL{Scheme: "https", Path: path, Host: hostIP})
	fw, err := portforward.New(dialer, []string{fmt.Sprintf("%s:%d", port, 3000)}, stopCh, readyCh, os.Stdout, os.Stderr)
	if err != nil {
		log.WithError(err).Error("Error port-forwarding.")
	}
	return fw.ForwardPorts()
}

// castCleanup removes CAST and Kubeshark resources
func castCleanup(helmClient helm.Client, clientset *kubernetes.Clientset, noDownload bool) {
	log.Info("Removing CAST resources.")
	kubesharkPath := getKubesharkCmd(context.TODO(), noDownload)
	kubesharkConfig := ensureKubesharkConfigfile()

	// Delete CAST release
	err := helmClient.UninstallReleaseByName("cast")
	if err != nil {
		log.WithError(err).Error("Error removing 'cast' release.")
	}

	// Delete cast namespace
	err = clientset.CoreV1().Namespaces().Delete(context.Background(), "cast", metav1.DeleteOptions{})
	if err != nil {
		log.WithError(err).Error("Error deleting 'cast' namespace")
		return
	}

	// Remove Kubeshark resources
	log.Info("Removing Kubeshark resources.")
	err = exec.Command(kubesharkPath, "clean", "--configpath", kubesharkConfig).Run()
	if err != nil {
		log.WithError(err).Error("Error running 'kubeshark clean'. ")
		return
	}

}

// handleError prevents canceled context errors after a context has been canceled
func handleError(ctx context.Context, message string, err error) {
	// if context has been canceled
	if ctx.Err() != nil {
		return
	}
	log.WithError(err).Error(message)

}
