# End to End CAST Testing

It is important that when reviewing and testing changes made to CAST
that we test using a typical deployment. This is easily accomplished
using our default Skaffold configuration.

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

## Deploying the test stack

From the root of the project, run the following command to build and
deploy to CAST helm chart to your local Kubernetes environment.

```bash
skaffold run --platform=linux/amd64 --port-forward --kube-context docker-desktop
```

Given that Skaffold builds production version of the CAST Docker
images, this may take multiple minutes.

When you see the following in the logs, the stack is ready for
testing. Make note of the URLs in your log, the ports may have changed
if your computer has something using the default port.

```text
Port forwarding service/cast-postgresql in namespace cast, remote port 5432 -> http://127.0.0.1:5432
Port forwarding service/cast-service in namespace cast, remote port 80 -> http://127.0.0.1:8000
Port forwarding service/httpbin in namespace cast, remote port 80 -> http://127.0.0.1:8080
Port forwarding service/cast-postgresql-hl in namespace cast, remote port 5432 -> http://127.0.0.1:5433
```

The front-end is the `service/cast-service` typically located at
<http://127.0.0.1:8000>
