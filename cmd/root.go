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

var namespace string = "all"
var kubeConfig = filepath.Join(homedir.HomeDir(), ".kube", "config")

var rootCmd = &cobra.Command{
	Use:   "cast -n [namespace]",
	Short: "CAST captures the network traffic in your namespace",
	Long:  "CAST: A tool to evaluate security concerns surrounding API Communication and Authentication. For more info: https://github.com/corshatech/cast. cast captures the network traffic in your namespace",
	RunE: func(cmd *cobra.Command, args []string) error {
		cast(namespace, kubeConfig, kubeContext)
		return nil
	},
}

func init() {
	rootCmd.Flags().StringP("namespace", "n", namespace, "The namespace to analyze.")
	rootCmd.Flags().String("kube-config", kubeConfig, "Path to kube config file.")
	rootCmd.Flags().String("kube-context", kubeContext, "Kube context to deploy CAST into.")
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the tapCmd.
func Execute() {
	cobra.CheckErr(rootCmd.Execute())
}
