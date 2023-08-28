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
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"os/exec"
	"path"
	"runtime"
	"strings"

	"github.com/kirsle/configdir"
	log "github.com/sirupsen/logrus"
	"golang.org/x/exp/slices"
)

var kubesharkCmdDefault string = "kubeshark"

func init() {
	if runtime.GOOS == "windows" {
		kubesharkCmdDefault = "kubeshark.exe"
	}
}

const kubesharkVersion string = "41.6" // supported Kubeshark version
var kubesharkChartDefault string = fmt.Sprintf("kubeshark-%s.tgz", kubesharkVersion)

// The default Kubeshark Config, customized for CAST.
// This is almost, very nearly, the same thing as the default Kubeshark
// configfile output by `kubeshark config`, except we've specified the
// specific, supported docker image that works with CAST.
const defaultKubesharkConfig string = `
tap:
  docker:
    registry: ghcr.io/corshatech/kubeshark
    tag: "corshav41.6"
    imagepullpolicy: Always
    imagepullsecrets: []
  proxy:
    worker:
      port: 8897
      srvport: 8897
    hub:
      port: 8898
      srvport: 80
    front:
      port: 8899
      srvport: 80
    host: 127.0.0.1
  regex: .*
  namespaces: []
  release:
    namespace: default
  persistentstorage: false
  storagelimit: 200Mi
  storageclass: standard
  dryrun: false
  pcap: ""
  resources:
    worker:
      limits:
        cpu: 750m
        memory: 1Gi
      requests:
        cpu: 50m
        memory: 50Mi
    hub:
      limits:
        cpu: 750m
        memory: 1Gi
      requests:
        cpu: 50m
        memory: 50Mi
  servicemesh: true
  tls: true
  packetcapture: libpcap
  ignoretainted: false
  labels: {}
  annotations: {}
  nodeselectorterms: []
  ingress:
    enabled: false
    classname: kubeshark-ingress-class
    controller: k8s.io/ingress-nginx
    host: ks.svc.cluster.local
    tls: []
    auth:
      approveddomains: []
    certmanager: letsencrypt-prod
  debug: false
logs:
  file: ""
config:
  regenerate: true
kube:
  configpath: ""
  context: ""
dumplogs: false
headless: true
license: ""
scripting:
  env: {}
  source: ""
  watchScripts: true
`

func getConfigDir() string {
	directory := configdir.LocalConfig("cast")
	err := configdir.MakePath(directory)
	if err != nil {
		log.WithError(err).
			WithField("configdir", directory).
			Fatal("Unable to ensure access to CAST config directory.")
	}
	return directory
}

// getKubesharkCommand returns the preferred absolute path of the Kubeshark
// binary CAST should be using. In addition, it calls ensureKubesharkVersion()
// which prints a user-facing warning if the Kubeshark in use doesn't match
// our preferred version.
//
//  1. If Kubeshark is on the path, use that Kubeshark.
//  2. Otherwise, try to use the Kubeshark from our config directory.
//  3. If neither (1) nor (2) already exist, download Kubeshark locally
//     into the config dir, then use that.
func getKubesharkCmd(ctx context.Context, noDownload bool) string {

	err := downloadKubesharkChart(ctx, noDownload)
	if err != nil {
		log.WithError(err).Fatal("Unable to find or install Kubeshark chart.")
	}

	kubesharkPath, err := exec.LookPath(kubesharkCmdDefault)
	if err == nil {
		ensureKubesharkVersion(kubesharkPath)
		return kubesharkPath
	}

	// An error is acceptable since it means kubeshark is
	// not on the system path, so we just go ahead with
	// downloading and installing our own copy.
	kubesharkPath, err = downloadKubeshark(ctx, noDownload)
	if err != nil {
		log.WithError(err).Fatal("Unable to find or install Kubeshark cli.")
	}
	ensureKubesharkVersion(kubesharkPath)
	return kubesharkPath
}

// Tests the kubeshark cli version with the version verb.
// Panics if calling the CLI doesn't succeed, since this is a problem with
// exec() and we need exec() to work.
//
// Otherwise, if the detected version appears to be unsupported, we log a
// warning but otherwise permit this.
func ensureKubesharkVersion(kubesharkPath string) {
	kubesharkOutput, err := exec.Command(kubesharkPath, "version").CombinedOutput()
	if err != nil {
		log.WithError(err).WithField("kubeshark", kubesharkPath).Fatalf("Unable to invoke Kubeshark")
	}

	if !strings.Contains(string(kubesharkOutput), kubesharkVersion) {
		log.Warnf("Warning: CAST is built to support Kubeshark version %s, and you're using version %s.", kubesharkVersion, kubesharkOutput)
		log.Warn("Some commands may not work as expected.")
	}
}

func ensureKubesharkConfigfile() string {
	// Get user's home directory
	homeDir, err := os.UserHomeDir()
	// If no home directory found, end with Fatal
	if err != nil {
		log.WithError(err).Fatal("Unable to find home directory.")
		return ""
	}

	kubesharkConfigPath := path.Join(homeDir, ".kubeshark")
	kubesharkConfigfile := path.Join(kubesharkConfigPath, "config.yaml")

	info, err := os.Stat(kubesharkConfigfile)
	// If the file can be statted,
	// and is regular,
	// and can be read (`& modebits with mask 0444` is nonzero)
	// then simply use it:
	if err == nil && info.Mode().IsRegular() && info.Mode()&0444 != 0 {
		return kubesharkConfigfile
	}

	// if any error other than NotExists (for which we'll write the file)
	// end with Fatal
	if !errors.Is(err, fs.ErrNotExist) {
		log.WithError(err).WithField("file", kubesharkConfigfile).Fatal("Unable to read config file.")
	}

	log.WithField("file", kubesharkConfigfile).Debug("Writing default config file.")
	err = os.MkdirAll(kubesharkConfigPath, 0700)
	if err != nil {
		log.WithError(err).WithField("directory", kubesharkConfigPath).Fatal("Unable to create config directory.")
	}
	// 0666 is file permission `rw-rw-rw-`
	err = os.WriteFile(kubesharkConfigfile, []byte(defaultKubesharkConfig), 0600)
	if err != nil {
		log.WithError(err).WithField("file", kubesharkConfigfile).Fatal("Unable to write config file.")
	}
	return kubesharkConfigfile
}

func downloadKubesharkChart(ctx context.Context, noDownload bool) error {
	configdir := getConfigDir()
	castKubesharkChart := path.Join(configdir, kubesharkChartDefault)

	info, err := os.Stat(castKubesharkChart)
	// if there is no error when statting,
	// AND the file is regular,
	// then we accept that this is the kubeshark chart:
	if err == nil && info.Mode().IsRegular() {
		os.Setenv("KUBESHARK_HELM_CHART_PATH", castKubesharkChart)
		return nil
	}

	// bail: attempt to download and install castKubesharkChart for the user.
	if noDownload {
		return fmt.Errorf("unable to locate kubeshark chart, and noDownload is set, so not installing automatically")
	}

	kubesharkChartDownload := fmt.Sprintf("https://corshatech.github.io/cast/%s", kubesharkChartDefault)

	log.WithFields(log.Fields{
		"url":         kubesharkChartDownload,
		"castDataDir": configdir,
	}).Info("Unable to locate Kubeshark chart, installing locally", kubesharkChartDownload)

	kubesharkChartOut, err := os.OpenFile(castKubesharkChart, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0500)
	if err != nil {
		return fmt.Errorf("error creating file %q", castKubesharkChart)
	}
	defer kubesharkChartOut.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, kubesharkChartDownload, nil)
	if err != nil {
		return fmt.Errorf("error building request to %q %w", kubesharkChartDownload, err)
	}

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("error connecting to %q %w", kubesharkChartDownload, err)
	}
	defer response.Body.Close()
	_, err = io.Copy(kubesharkChartOut, response.Body)
	if err != nil {
		return fmt.Errorf("error downloading release from %q %w", kubesharkChartDownload, err)
	}

	os.Setenv("KUBESHARK_HELM_CHART_PATH", castKubesharkChart)

	log.WithField("file", castKubesharkChart).Infof("Installed Kubeshark chart successfully")
	return nil
}

// downloadKubeshark downloads the Kubeshark binary to the UserConfigDir and returns the path to the binary.
func downloadKubeshark(ctx context.Context, noDownload bool) (string, error) {
	configdir := getConfigDir()
	castKubeshark := path.Join(configdir, kubesharkCmdDefault)

	info, err := os.Stat(castKubeshark)
	// if there is no error when statting,
	// AND the file is regular,
	// AND the file is executable (`& modebits with mask 0111` is nonzero)
	// then we accept that this is the kubeshark executable:
	if err == nil && info.Mode().IsRegular() && info.Mode()&0111 != 0 {
		return castKubeshark, nil
	}

	// bail: attempt to download and install castKubeshark for the user.
	if noDownload {
		return "", fmt.Errorf("unable to locate kubeshark, and noDownload is set, so not installing automatically")
	}

	// First, figure out download URL.

	osArch := fmt.Sprintf("%s_%s", runtime.GOOS, runtime.GOARCH)
	available := []string{"darwin_amd64", "darwin_arm64", "linux_amd64", "linux_arm64"}
	if !slices.Contains(available, osArch) {
		return "", fmt.Errorf("unsupported OS or architecture: %q. For more details, visit https://github.com/kubeshark/kubeshark/releases/tag/%s", osArch, kubesharkVersion)
	}

	kubesharkDownload := fmt.Sprintf("https://github.com/kubeshark/kubeshark/releases/download/%s/kubeshark_%s", kubesharkVersion, osArch)

	log.WithFields(log.Fields{
		"url":         kubesharkDownload,
		"castDataDir": configdir,
	}).Info("Unable to locate Kubeshark, installing locally", kubesharkDownload)

	kubesharkOut, err := os.OpenFile(castKubeshark, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0500)
	if err != nil {
		return "", fmt.Errorf("error creating file %q", castKubeshark)
	}
	defer kubesharkOut.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, kubesharkDownload, nil)
	if err != nil {
		return "", fmt.Errorf("error building request to %q %w", kubesharkDownload, err)
	}

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("error connecting to %q %w", kubesharkDownload, err)
	}
	defer response.Body.Close()
	_, err = io.Copy(kubesharkOut, response.Body)
	if err != nil {
		return "", fmt.Errorf("error downloading release from %q %w", kubesharkDownload, err)
	}

	log.WithField("file", castKubeshark).Infof("Installed Kubeshark successfully")
	return castKubeshark, nil
}
