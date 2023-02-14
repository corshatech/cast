# Contributing Guidelines

## Code of Conduct
Thank you for your interest in contributing to CAST! We are dedicated to making contributing to our project a positive experience for everyone. We ask that our users and contributors review and observe our [Code of Conduct](./CODE_OF_CONDUCT.md).

## The Contributor License Agreement
In order to contribute to CAST, you will need to sign Corsha's [Contributor License Agreement](./CLA.md) and email the signed copy to legal@corsha.com.

## Contribution Guidelines

* Code style - most of the code is written in Go, please follow [these guidelines](https://golang.org/doc/effective_go)
* Go-tools compatible (`go get`, `go test`, etc.)
* Code coverage for unit tests must not decrease.
* Code must be usefully commented. Not only for developers on the project, but also for external users of these packages
* When reviewing PRs, you are encouraged to use Golang's [code review comments page](https://github.com/golang/go/wiki/CodeReviewComments)
* Project follows [Google JSON Style Guide](https://google.github.io/styleguide/jsoncstyleguide.xml) for the REST APIs that are provided.

## Local Development

We use docker-desktop and Skaffold for local development:

```bash
# deploy to the cast namespace
skaffold dev --platform=linux/amd64 --port-forward --kube-context docker-desktop


# OR deploy to a custom namespace
skaffold dev --platform=linux/amd64 --port-forward --kube-context docker-desktop --namespace "<NS>"
```

Skaffold will watch for changes and redeploy the application to docker-desktop.

Now that Cast is up, we can run a Kubeshark tap on all the pods locally


```bash
kubectl config use-context docker-desktop
kubeshark tap -A
```

## Deploying the local chart to a remote cluster

If you would like to test the local chart on a remote cluster, you will need to push the docker image to a docker registry that is accessible to your remote cluster.

If that docker registry requires logging in, you will need to [create a docker-registry secret](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/#registry-secret-existing-credentials) called `regcred` in the namespace you're deploying CAST to.

Then set ```build.local.push: true``` in ```skaffold.yaml```.

After that preliminary setup is done, we can iterate on the chart using the remote cluster in the same way we did with docker-desktop. We just need to change the docker registry with the `--default-repo` argument.

```bash
kubectl config use-context "$KUBE_CONTEXT"
skaffold dev --platform=linux/amd64 --port-forward --namespace "$NAMESPACE" --default-repo="$REPO"
```

## End to End Testing

Skaffold can be used to test the entire CAST pipeline:
```bash
skaffold run --platform=linux/amd64 --port-forward --kube-context <kube context>
```

The repository's [Skaffold config](./skaffold.yaml) has a lifecycle hook that taps an httpbin deployment with Kubeshark and sends mock traffic data to that httpbin service's endpoint for CAST to analyse. The script can also be run seperately for an existing CAST deployment and Kubeshark tapped service:
```bash
./scripts/generate-pipeline-data.sh <service endpoint>
```

Note: Skaffold will not remove Kubeshark during resource cleanup. To remove Kubeshark resources, use ```kubeshark clean```. 

If you wish to generate your own test traffic for CAST, you can do so with CURL calls. For example, traffic can be sent to the httpbin service created by the repository's [Skaffold config](./skaffold.yaml) by sending CURL requests from a curl pod in your kube cluster as follows:

```bash
kubectl create namespace curl
kubectl -n curl delete pod curl
kubectl run curl -n curl --image=curlimages/curl -- sleep 3600
kubectl wait --for=condition=Ready pod/curl -n curl
kubectl exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token1" "http://httpbin.cast.svc.cluster.local/headers?q=1"
```

## Releasing

To release the chart, you just need to create a docker release. GitHub actions will do the rest.

## Communication

If you have any questions or concerns, please email Max at max@corsha.com.
