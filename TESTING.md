# End-To-End CAST Testing

It is important that when reviewing and testing changes made to CAST
that we test using a typical deployment. This can be accomplished
by building the CAST binary and Docker images locally.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Skaffold](https://skaffold.dev)
- You will need access to a Kubernetes cluster. The easiest way to get one, if you don't have one is [Kubernetes in Docker Desktop](https://docs.docker.com/desktop/kubernetes/#enable-kubernetes).
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

## Installing CAST

- Download the `cast` cli from [the releases page](https://github.com/corshatech/cast/releases/), appropriate for your platform and architecture.
- Move the executable (with sudo) into the `bin` directory to install it:
    ```sh
    chmod +x {YOUR_DOWNLOAD_DIRECTORY}/cast_platform_arch
    mv {YOUR_DOWNLOAD_DIRECTORY}/cast_platform_arch /usr/local/bin/cast
    ```
- Run the `cast` cli to install CAST:
    ```sh
    cast
    ```

# Seeding Test Data

- Set your ```kube-context``` and create a sample httpbin service for CAST to analyze.
    ```bash
    kubectl config set-context docker-desktop
    helm repo add matheusfm https://matheusfm.dev/charts
    kubectl create namespace httpbin
    helm install -n httpbin httpbin matheusfm/httpbin
    ```
- Add the Bitnami Helm repo.
    ```bash
    helm repo add bitnami https://charts.bitnami.com/bitnami
    ```
- If you would like to generate testing data for the sample service,
you can do so by running the
[generate-pipeline-data.sh](./scripts/generate-pipeline-data.sh)
script to send CURL requests to your sample httpbin service.
    ```sh
    ./scripts/generate-pipeline-data.sh http://httpbin.httpbin.svc.cluster.local
    ```
