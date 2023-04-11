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
	var result []Finding

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

		scanResult, err := kubesecScan(prefixString, ns, b.String())
		if err != nil {
			return nil, err
		}

		result = append(result, scanResult...)
	}

	return result, nil
}

func scanAll(client *dynamic.DynamicClient) ([]Finding, error) {
	var result []Finding

	for _, kind := range scanKinds {
		log.WithField("kind", kind).Info("Inspecting resources of type")
		resultsForKind, err := scanAllForKind(client, kind)
		if err != nil {
			return nil, err
		}
		result = append(result, resultsForKind...)
	}
	return result, nil
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
		log.WithError(err).Fatal("Couldn't scan all K8s resources")
	}

	log.WithField("resultsLength", len(results)).
		Info("Scan completed. Writing results to CAST DB...")
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
