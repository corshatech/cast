# Developing for CAST

This file describes ways you can develop software for the CAST system.

## Local Development

We use [Docker
Desktop](https://www.docker.com/products/docker-desktop/) and
[Skaffold](https://skaffold.dev) for local development. You will need
to [enable
Kubernetes](https://docs.docker.com/desktop/kubernetes/#enable-kubernetes)
support within Docker Desktop.

### Prerequisites

To work with the dev environment, you will need all of these files and tools:
1. Docker + Kubernetes.
    > **Note**
    > We assume you will be working using Docker Desktop, with the preinstalled Docker Desktop + Kubernetes support. [You can install Docker from here](https://www.docker.com/products/docker-desktop/) and enable the Kubernetes integration directly within Docker Desktop. Other setups which create a Docker-compatible local environment plus K8s may work, but we only officially test development workflows on Docker Desktop.
2. Helm
    > We assume that Helm 3 is installed and available as `helm`. You can install Helm by [following Helm's install instructions](https://helm.sh/docs/intro/install/).
2. Skaffold
    > Skaffold is used for automating a development-mode deployment of CAST's components, and for working with CAST's Helm charts locally. [You can install Skaffold from here](https://skaffold.dev).
3. Kubeshark (v 41.6)
    > At the time of writing we support Kubeshark at exactly version 41.6. While the CAST CLI tool will download and manage a user's Kubeshark for itself, our development scripts using Skaffold assume Kubeshark is installed system-wide. Please download and install [the appropriate Kubeshark CLI tool from here](https://github.com/kubeshark/kubeshark/releases/tag/41.6) and make sure that when you do `kubeshark version` at the command line, it is exactly 41.6.
4. Kubeshark's Helm Chart for 41.6
    > At the time of writing, our development deployment script requires you to download the Kubeshark 41.6 Helm Chart as a .tgz file. [Please download this exact copy of the Helm chart](https://github.com/corshatech/cast/raw/gh-pages/kubeshark-41.6.tgz). The file can be placed anywhere on your system; you will need read access to it from scripts. Make a note of where you saved it, you will need the chart's full path to start the dev environment.
5. The Bitnami helm repo
    > The script we've written which injects test data into the CAST system assumes the Bitnami Helm repo is preconfigured, and called `bitnami`. You can set this up with the following command, which only needs to be run once:
    > ```bash
    > helm repo add bitnami https://charts.bitnami.com/bitnami
    > ```

### Deploying CAST for local development

The local Skaffold deployment starts Kubeshark, CAST, creates a
`./ui/.env.local` file, and runs `scripts/generate-pipeline-data.sh`
to insert test data.

> **Warning**
> If you have run the Skaffold deployment before, YOU MUST RUN THE [CLEANUP](#cleanup) STEPS to ensure any remaining resources from previous deployments have been removed before you redeploy.

Typically, when you are working on CAST, you will want to run the
application in headless mode. This skips the build and deployment of
the front-end which can take considerable time.

`skaffold dev` will redeploy the application whenever changes are
detected. You can then use `npm run dev` to iterate on the front-end
without redeployment.

To deploy CAST locally in headless mode run the following command:

```bash
KUBESHARK_HELM_CHART_PATH="/path/to/helm/chart" skaffold dev --profile headless --port-forward
```

Once you see the log message "Starting export of records.", the
back-end of CAST is running.

> **Note**
>
> If another service is listening on 5432, Skaffold will listen
> on another port, typically 5433.
>
> The log line that you want to look for looks like this:
>
> ```text
> Port forwarding service/cast-postgresql in namespace cast, remote port 5432 -> http://127.0.0.1:5432
> ```
>
> Make note of this port, you will need to update `./ui/.env.local`
> with this port if it is not 5432

> **Warning**
> There is a known issue where if you use multiple files in your
> `KUBECONFIG` environment variable the dev deployment will not work.
> To work around this known issue, please temporarily set your
> `KUBECONFIG` to just the one file containing the config for
> docker-desktop, as in: `export KUBECONFIG="${HOME}/.kube/config.yml"`

> **Warning**
> There is a known issue where the `--context` command-line flag for explicitly setting the Kube Context to use does not function properly with our setup. **Please ensure that your _current_ kube context** is set to docker-desktop before running the deployment scripts, otherwise unexpected behavior may result.

> **Warning**
>
> For Apple Silicon Mac users, you may have issues deploying the Kubesec
> component. If you are running a kubernetes environment hosted by an Apple
> Silicon chip (such as an M1 Mac) you can resolve this by running the command:
> ```
> docker pull --platform=linux/amd64 kubesec/kubesec:v2
> ```
> to manually pull the 64bit-Intel image for Kubesec.

Open a new terminal to run the front-end within.

To run the UI application in development mode, first update your
```./ui/.env.local``` file with the cast-postgres connection details:

```bash
cat > ./ui/.env.local <<HERE
PGUSER=cast
PGPASSWORD=dev-password
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=cast
HERE
```

Run the following commands to start the front-end

```bash
cd ./ui
npm ci # optionally install packages
npm run dev
```

This starts the front-end located at <http://localhost:3000>

You should be ready to work on CAST. Changes to the back-end will be
redeployed by Skaffold, and changes made to the front-end will be
reloaded by the Next.js development server

### Cleanup

Some components may still be running if you have run Skaffold
before. From the root of the project, run the following set of command
to ensure all resources created by Skaffold are removed.

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

Then remove any remaining Statefulset resources and namespaces
after shutting down the Skaffold deployment.

```bash
make cast-clean
```

## Releasing

To release the chart, you just need to create a docker release. GitHub
actions will do the rest.
