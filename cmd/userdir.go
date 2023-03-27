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

const kubesharkVersion string = "38.5" // supported Kubeshark version

// The default Kubeshark Config, customized for CAST.
// This is almost, very nearly, the same thing as the default Kubeshark
// configfile output by `kubeshark config`, except we've specified the
// specific, supported docker image that works with CAST.
const defaultKubesharkConfig string = `
tap:
    docker:
        registry: ghcr.io/corshatech/kubeshark-
        tag: "corshav38.5"
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
    allnamespaces: false
    storagelimit: 200MB
    dryrun: false
    pcap: ""
    resources:
        worker:
            cpu-limit: 750m
            memory-limit: 1Gi
            cpu-requests: 50m
            memory-requests: 50Mi
        hub:
            cpu-limit: 750m
            memory-limit: 1Gi
            cpu-requests: 50m
            memory-requests: 50Mi
    servicemesh: true
    tls: true
    packetcapture: libpcap
    debug: false
logs:
    file: ""
selfnamespace: kubeshark
dumplogs: false
headless: true
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
	ksOutput, err := exec.Command(kubesharkPath, "version").CombinedOutput()
	if err != nil {
		log.WithError(err).WithField("kubeshark", kubesharkPath).Fatalf("Unable to invoke Kubeshark")
	}

	if !strings.Contains(string(ksOutput), kubesharkVersion) {
		log.Warnf("Warning: CAST is built to support Kubeshark version %s, and you're using version %s.", kubesharkVersion, ksOutput)
		log.Warn("Some commands may not work as expected.")
	}
}

func ensureKubesharkConfigfile() string {
	configdir := getConfigDir()
	castConfigfile := path.Join(configdir, "kubeshark-config.yaml")

	info, err := os.Stat(castConfigfile)
	// If the file can be statted,
	// and is regular,
	// and can be read (`& modebits with mask 0444` is nonzero)
	// then simply use it:
	if err == nil && info.Mode().IsRegular() && info.Mode()&0444 != 0 {
		return castConfigfile
	}

	// if any error other than NotExists (for which we'll write the file)
	// end with Fatal
	if !errors.Is(err, fs.ErrNotExist) {
		log.WithError(err).WithField("file", castConfigfile).Fatal("Unable to read config file.")
	}

	log.WithField("file", castConfigfile).Debug("Writing default config file.")
	// 0666 is file permission `rw-rw-rw-`
	err = os.WriteFile(castConfigfile, []byte(defaultKubesharkConfig), 0600)
	if err != nil {
		log.WithError(err).WithField("file", castConfigfile).Fatal("Unable to write config file.")
	}
	return castConfigfile
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
		return "", fmt.Errorf("unsupported OS or architecture: %s. For more details, visit https://github.com/kubeshark/kubeshark/releases/tag/%s", osArch, kubesharkVersion)
	}

	ksDownload := fmt.Sprintf("https://github.com/kubeshark/kubeshark/releases/download/%s/kubeshark_%s", kubesharkVersion, osArch)

	log.WithFields(log.Fields{
		"url":         ksDownload,
		"castDataDir": configdir,
	}).Info("Unable to locate Kubeshark, installing locally", ksDownload)

	ksOut, err := os.Create(castKubeshark)
	if err != nil {
		return "", fmt.Errorf("error creating file \"%s\"", castKubeshark)
	}
	defer ksOut.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, ksDownload, nil)
	if err != nil {
		return "", fmt.Errorf("error downloading release from %s %v", ksDownload, err)
	}

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("error downloading release from %s %v", ksDownload, err)
	}
	defer response.Body.Close()
	_, err = io.Copy(ksOut, response.Body)
	if err != nil {
		return "", fmt.Errorf("error downloading release from %s %v", ksDownload, err)
	}

	log.WithField("file", castKubeshark).Infof("Installed Kubeshark successfully")
	return castKubeshark, nil
}
