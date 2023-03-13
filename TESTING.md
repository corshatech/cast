# End to End CAST Testing

It is important that when reviewing and testing changes made to CAST
that we test using a typical deployment. This can be accomplished
by building the CAST binary and Docker images locally.

## Prerequisites

You will need [Docker
Desktop](https://www.docker.com/products/docker-desktop/) and
[Skaffold](https://skaffold.dev) installed. You will also need to
[enable
Kubernetes](https://docs.docker.com/desktop/kubernetes/#enable-kubernetes)
support within Docker Desktop.

## Cleaning up previous deployments

Some components may still be running if you have run Skaffold
before. From the root of the project, run the following set of command
to ensure everything is clean before testing features.

```bash
skaffold delete 
```

You may see error messages like the follow if your state is already
clean.

```text
Cleaning up...
Error: uninstall: Release not loaded: cast: release: not found
Error: uninstall: Release not loaded: httpbin: release: not found
exit status 1
exit status 1
```

## Testing CAST Locally

In the [Makefile](./Makefile) for the project, confirm the ```VERSION``` environment variable
matches with the version of the local CAST helm chart in [Chart.yaml](./k8s/helm/cast/Chart.yaml).
Then build updated local Docker images for the CAST collector and UI.

```bash
make images
```

Create a local CAST binary.

```bash
make cast
```

Set your ```kube-context``` and create a sample httpbin service for CAST to analyze.

```bash
kubectl config set-context docker-desktop
helm repo add matheusfm https://matheusfm.dev/charts
kubectl create namespace httpbin
helm install -n httpbin httpbin matheusfm/httpbin
```

Run the CAST binary with the ```test``` flag enabled to run CAST in local testing mode.

```bash
./build/package/cast -n httpbin --test=true
```

If you would like to generate testing data for the sample service,
you can do so by running the
[generate-pipeline-data.sh](./scripts/generate-pipeline-data.sh)
script to send CURL requests to your sample httpbin service.

```bash
sh scripts/generate-pipeline-data.sh http://httpbin.httpbin.svc.cluster.local
```


