package main

import (
	"bufio"
	"bytes"
	"context"
	"fmt"

	log "github.com/sirupsen/logrus"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/cli-runtime/pkg/printers"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

var ExcludeNamespaces = []string{
	"kube-system",
}

var scanKinds = []schema.GroupVersionResource{
	{Group: "", Version: "v1", Resource: "pods"},
	{Group: "apps", Version: "v1", Resource: "deployments"},
	{Group: "apps", Version: "v1", Resource: "statefulsets"},
	{Group: "apps", Version: "v1", Resource: "daemonsets"},
}

func isExclude(namespace string) bool {
	for _, el := range ExcludeNamespaces {
		if namespace == el {
			return true
		}
	}
	return false
}

func scanAllForKind(
	client *dynamic.DynamicClient,
	resource schema.GroupVersionResource,
) ([]Finding, error) {
	res := make([]Finding, 0)
	list, err := client.Resource(resource).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	for _, item := range list.Items {
		prefixString := fmt.Sprintf(
			"%s/%s",
			resource.Resource,
			item.GetName(),
		)
		ns := item.GetNamespace()

		if isExclude(ns) {
			log.WithFields(log.Fields{
				"resource":  prefixString,
				"namespace": ns,
			}).Info("Skipping: ignoring namespace")

			continue
		}

		log.WithFields(log.Fields{
			"resource":  prefixString,
			"namespace": ns,
		}).Info("Scanning")

		var b bytes.Buffer
		writer := bufio.NewWriter(&b)
		y := printers.YAMLPrinter{}

		err = y.PrintObj(&item, writer)
		if err != nil {
			return nil, err
		}

		scanResult, err := kubesecScan(prefixString, b.String())
		if err != nil {
			return nil, err
		}

		res = append(res, scanResult...)
	}

	return res, nil
}

func scanAll(client *dynamic.DynamicClient) ([]Finding, error) {
	res := make([]Finding, 0)

	for _, kind := range scanKinds {
		log.WithField("kind", kind).Info("Inspecting resources of type")
		resultsForKind, err := scanAllForKind(client, kind)
		if err != nil {
			return nil, err
		}
		res = append(res, resultsForKind...)
	}
	return res, nil
}

func main() {
	config, err := rest.InClusterConfig()
	if err != nil {
		log.WithError(err).Fatal("Couldn't construct K8s InClusterConfig")
	}

	client, err := dynamic.NewForConfig(config)
	if err != nil {
		log.WithError(err).Fatal("Couldn't connect to K8s API")
	}

	results, err := scanAll(client)
	if err != nil {
		log.WithError(err).Fatal("Could not scan all K8s resources")
	}

	log.WithField("resultsLength", len(results)).
		Info("Scan completed. Writing results to CAST db...")
	for _, result := range results {
		err = writeFinding(result)
		if err != nil {
			log.WithError(err).Fatal("Couldn't write results of scan to database")
		}
	}
	log.Info("Results written. Writing completion notice...")
	err = writeCompleted()
	if err != nil {
		log.WithError(err).Fatal("Couldn't write scan completed to database")
	}
	log.Info("Done.")
}
