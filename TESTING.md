# End-To-End CAST Testing

It is important that when reviewing and testing changes made to CAST
that we test using a typical deployment. This can be accomplished
by building the CAST binary and Docker images locally.

## Prerequisites

- You will need access to a Kubernetes cluster. The easiest way to get one,
if you don't have one is
[Kubernetes in
Docker Desktop](https://docs.docker.com/desktop/kubernetes/#enable-kubernetes).
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

> **Note**
>
> If you will be seeding test data using our httpbin setup, you will
> additionally need [helm](https://helm.sh). You do not need helm if you are not
> using the test-data script.

> **Warning**
>
> For Apple Silicon Mac users, you may have issues deploying the Kubesec
> component. If you are running a kubernetes environment hosted by an Apple
> Silicon chip (such as an M1 Mac) you can resolve this by running the command:
> ```
> docker pull --platform=linux/amd64 kubesec/kubesec:v2
> ```
> to manually pull the 64bit-Intel image for Kubesec.

## Installing CAST

- Install CAST with brew.

    ```sh
    brew tap corshatech/cast
    brew install cast
    ```

- Run the `cast` cli to install CAST into your K8s environment:

    ```sh
    cast
    ```

## Seeding Test Data

- Set your `kube-context` and create a sample httpbin service for
CAST to analyze.

    ```bash
    helm repo add matheusfm https://matheusfm.dev/charts
    kubectl create namespace httpbin
    helm install -n httpbin httpbin matheusfm/httpbin
    ```

- If you would like to generate testing data for the sample service,
you can do so by running the
[generate-pipeline-data.sh](./cripts/generate-pipeline-data.sh)
script to send CURL requests to your sample httpbin service.

    ```sh
    ./scripts/generate-pipeline-data.sh http://httpbin.httpbin.svc.cluster.local
    ```
