package cmd

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/kirsle/configdir"
	helm "github.com/mittwald/go-helm-client"
	log "github.com/sirupsen/logrus"
	"golang.org/x/exp/slices"
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
func Cast(namespace string, port string, kubeConfigPath string, kubeContext string) {
	log.Info("Namespace to be analyzed: ", namespace)

	// trap Ctrl+C and call cancel on the context
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Check for Kubeshark

	ksOutput, err := exec.Command("kubeshark", "version").CombinedOutput()
	kubesharkPath := "kubeshark" // path to kubeshark binary

	// TODO: remove v37.0 check once 38+ compatible
	// If Kubeshark is not in $PATH or is not v37.0, download binary into UserConfigDir
	if err != nil || !strings.Contains(string(ksOutput), "37.0") {
		log.Info("Kubeshark v37.0 is not installed. Installing Kubeshark v37.0 in app config directory.")
		kubesharkPath, err = downloadKubeshark(ctx)
		if err != nil {
			log.WithError(err).Error("Failed to install Kubeshark v37.0.")
			return
		}
	}

	log.Info("Kubeshark v37.0 installation confirmed.")

	// Create helm client

	var kubeConfig []byte
	kubeConfig, err = os.ReadFile(kubeConfigPath)
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
	ksCmd := exec.CommandContext(ctx, kubesharkPath, "tap", "-n", namespace, "--set", "headless=true", "--set", cmdConfig, "--set", cmdContext)

	// k communicates kubeshark tap errors
	k := make(chan error)
	err = ksCmd.Start()
	if err != nil {
		log.WithError(err).Fatal("Error starting kubeshark tap. ")
	}
	go func() {
		err := ksCmd.Wait()
		k <- err
	}()

	go func() {
		err := <-k
		if err != nil && err.Error() != "signal: killed" {
			log.WithError(err).Fatal("Error running kubeshark tap.")
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

	defer castCleanup(helmClient, clientset, kubesharkPath)

	go func(ctx context.Context) {
		select {
		case <-ctx.Done():
			return
		default:
			deployCast(ctx, helmClient, clientset, config, port)
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
func deployCast(ctx context.Context, helmClient helm.Client, clientset *kubernetes.Clientset, config *rest.Config, port string) {

	chartSpec := helm.ChartSpec{
		ReleaseName:     "cast",
		CreateNamespace: true,
		ChartName:       "corshatech/cast",
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
		println("Port forwarding is ready. CAST is available at http://localhost:3000/")
		break
	case <-ctx.Done():
		close(stopCh)
	}
}

// TODO: update download link with 'latest' tag once kubeshark 38+ compatible
// downloadKubeshark downloads the kubeshark binary to the UserConfigDir and returns the path to the binary.
func downloadKubeshark(ctx context.Context) (string, error) {
	osArch := fmt.Sprintf("%s_%s", runtime.GOOS, runtime.GOARCH)
	available := []string{"darwin_amd64", "darwin_arch64", "linux_amd64", "linux_arch64"}
	if !slices.Contains(available, osArch) {
		return "", fmt.Errorf("Unsupported OS or architecture: %s. For more details, visit https://github.com/kubeshark/kubeshark/releases/tag/37.0.", osArch)
	}

	// download binary to config directory
	ksDownload := fmt.Sprintf("https://github.com/kubeshark/kubeshark/releases/download/37.0/kubeshark_%s", osArch)

	configPath := configdir.LocalConfig("cast")
	err := configdir.MakePath(configPath) // Ensure it exists.
	if err != nil {
		return "", fmt.Errorf("Error creating private config directory: %v", err)
	}

	kubesharkPath := filepath.Join(configPath, "kubeshark")

	// check if Kubeshark v37.0 has already been downloaded to UserConfigDir.
	ksOutput, err := exec.Command(kubesharkPath, "version").CombinedOutput()
	if err == nil {
		if strings.Contains(string(ksOutput), "37.0") {
			log.Infof("Kubeshark v37.0 already exists in %s.", configPath)
			return kubesharkPath, nil
		}
		log.Infof("Incorrect Kubeshark version found in %s. Deleting and installing v37.0.", configPath)
		os.Remove(kubesharkPath)
	}

	ksOut, err := os.Create(kubesharkPath)
	if err != nil {
		return "", fmt.Errorf("Error creating file to download kubeshark into:%v", err)
	}
	defer ksOut.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, ksDownload, nil)
	if err != nil {
		return "", fmt.Errorf("Error creating kubeshark download GET request: %v", err)
	}

	client := http.DefaultClient
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Error downloading release from %s: %v", ksDownload, err)
	}

	defer resp.Body.Close()
	_, err = io.Copy(ksOut, resp.Body)
	if err != nil {
		return "", fmt.Errorf("Error copying response into kubeshark file: %v", err)
	}
	err = os.Chmod(kubesharkPath, 0755)
	if err != nil {
		return "", fmt.Errorf("Error doing chmod 755: %v", err)
	}

	log.Infof("Kubeshark v37.0 successfully installed at %s", kubesharkPath)
	return kubesharkPath, nil

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
func castCleanup(helmClient helm.Client, clientset *kubernetes.Clientset, kubesharkPath string) {
	log.Info("Removing CAST resources.")

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

	// Remove kubeshark resources
	err = exec.Command(kubesharkPath, "clean").Run()
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
