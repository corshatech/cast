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
	"path/filepath"

	"github.com/spf13/cobra"
	"k8s.io/client-go/util/homedir"
)

var (
	// Used for flags.
	kubeContext string
)

var port string = "3000"
var namespace string
var kubeConfig string = filepath.Join(homedir.HomeDir(), ".kube", "config")
var castChartVersion string
var testMode bool
var noDownload bool

var rootCmd = &cobra.Command{
	Use:   "cast [OPTIONS]",
	Short: "CAST captures the network traffic in your namespace",
	Long:  "CAST: A tool to evaluate security concerns surrounding API Communication and Authentication. For more info: https://github.com/corshatech/cast. cast captures the network traffic in your namespace",
	RunE: func(cmd *cobra.Command, args []string) error {
		cast(namespace, port, kubeConfig, kubeContext, noDownload, testMode)
		return nil
	},
}

func init() {
	rootCmd.Flags().StringVarP(&namespace, "namespace", "n", "all", "The namespace to analyze.")
	rootCmd.Flags().StringVarP(&port, "port", "p", "3000", "The port the CAST UI will be available on.")
	rootCmd.Flags().StringVar(&castChartVersion, "use-version", "", "The version of the CAST Helm Chart to deploy. If empty, will use the latest version.")
	rootCmd.Flags().StringVar(&kubeConfig, "kube-config", kubeConfig, "Path to kube config file.")
	rootCmd.Flags().StringVar(&kubeContext, "kube-context", kubeContext, `Kube context to deploy CAST into. (default "current-context")`)
	rootCmd.Flags().BoolVar(&testMode, "test", false, `Enables local testing mode.`)
	rootCmd.Flags().BoolVar(&noDownload, "no-download", false, "Do not automatically download and install Kubeshark.")
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the tapCmd.
func Execute() {
	cobra.CheckErr(rootCmd.Execute())
}
