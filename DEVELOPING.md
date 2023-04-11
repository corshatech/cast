# Developing for CAST

This file describes ways you can develop software for the CAST system.

## Local Development

We use [Docker
Desktop](https://www.docker.com/products/docker-desktop/) and
[Skaffold](https://skaffold.dev) for local development. You will need
to [enable
Kubernetes](https://docs.docker.com/desktop/kubernetes/#enable-kubernetes)
support within Docker Desktop.

Our development tooling assumes that you have [Kubeshark
installed](https://docs.kubeshark.co/en/install) and in your PATH.

You will need to add the Bitnami Helm repo in order to deploy cast
using Skaffold

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
```

The local Skaffold deployment starts Kubeshark, CAST, creates a
`./ui/.env.local` file, and runs `scripts/generate-pipeline-data.sh`
to insert test data.

If you have run the Skaffold deployment before, the [Cleanup](#cleanup)
steps will ensure any remaining resources from previous deployments
have been removed before you redeploy.

Typically, when you are working on CAST, you will want to run the
application in headless mode. This skips the build and deployment of
the front-end which can time considerable time.

`skaffold dev` will redeploy the application whenever changes are
detected. You can then use `npm run dev` to iterate on the front-end
without redeployment.

To deploy CAST locally in headless mode run the following command:

```bash
skaffold dev --platform=linux/amd64 --profile headless --port-forward --kube-context docker-desktop
```

Once you see the log message "Starting export of records.", the
back-end of CAST is running.

> :memo: If another service is listening on 5432, Skaffold will listen
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