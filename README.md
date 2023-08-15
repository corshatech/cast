
# CAST

CAST is an API security tool being developed to evaluate Kubernetes
API traffic for authentication vulnerabilities such as reused
credentials.

CAST deploys simply and easily with a single command into your environment,
where it can immediately begin monitoring traffic flows and the security and
health of your cluster.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Evaluated Security Concerns](#evaluated-security-concerns)
  - [Credential Reuse](#credential-reuse)
  - [Kubesec](#kubesec)
- [Install CAST](#install-cast)
  - [Kubeshark](#kubeshark)
- [Contributing](#contributing)
- [Developing with CAST](#developing-with-cast)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Evaluated Security Concerns

CAST is a tool to evaluate security concerns surrounding API
Communication and Authentication. These security concerns are
explained here.

### Credential Reuse

Today API Clients authenticate to API services using an authentication
scheme involving bearer credentials. These credentials are generally
come in the form of static, multi-use secrets such as a
username/password, bearer tokens, and client PKI certificates. These
largely static keys, tokens, and certs are vulnerable to credential
theft because as long as you possess the credential, you can use it to
gain access to API services. The bearer model does not take into
account how the credential was obtained, i.e. perhaps stolen, or pin
access to only trusted clients.  This weakness requires that API
credentials like these must be kept as safe as possible, not shared,
regularly rotated, and always created with tight expiry windows. The
[Open Web Application Security Project (OWASP)](https://owasp.org/)
has recognized these Identification and Authentication Failures in
their Annual "Top 10" vulnerabilities, stating "Where possible,
implement multi-factor authentication to prevent automated credential
stuffing, brute force, and stolen credential reuse attacks." - [OWASP
Top
10](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/).

Unfortunately, because of the growing API ecosystems across cloud and
hybrid environments; the incredible, rapid adoption of Kubernetes; and
the exciting race to automate, API credentials often have poor
security hygiene. This provides an expansive and growing attack vector
where adversaries can use this scale and lack of security hygiene to
their advantage.

CAST is a tool that will help you shine a light into the dark corners
of Kubernetes-based API credential usage whether your API clients and
services are running in cloud, your own datacenters, or even
on-premises. It is designed to help you quickly identify poor API
secrets hygiene, such as sharing the same key or token across multiple
workloads.

### Kubesec

CAST will also run Kubesec scans against all the containers and workloads in
your Kubernetes cluster.

[Kubesec](https://kubesec.io/) is a tool which evaluates your Kubernetes
resources for standards and best practices. The Kubesec scan runs and reports
results hourly in the default configuration. Some Kubesec results are advisory,
however, results marked "critical" may have significant impact on the security
of your cluster or workloads.

## Install CAST

CAST is distributed as a CLI tool that helps manage the complexity of installing
and uninstalling the K8s components for CAST. You can install the CAST binary
with `brew` on MacOS and Linux:

```sh
brew tap corshatech/cast
brew install cast
```

Then run CAST using the newly-installed `cast` command.

If you want to limit CAST to scanning a single namespace, use the `-n` flag:

```bash
cast -n <namespace>
```

The CAST tool automatically forwards the CAST user interface to the host where
you started it. On the same computer where you started CAST, you can open your
browser to [http://localhost:3000](http://localhost:3000/) to see CAST results.

For advanced usage and all CLI flags, use the `--help` flag, as in:

```bash
cast --help
```

> **Warning**
>
> For Apple Silicon Mac users, you may have issues deploying the Kubesec
> component. If you are running a kubernetes environment hosted by an Apple
> Silicon chip (such as an M1 Mac) you can resolve this by running the command:
> ```
> docker pull --platform=linux/amd64 kubesec/kubesec:v2
> ```
> to manually pull the 64bit-Intel image for Kubesec.

### Kubeshark

CAST uses [Kubeshark](https://kubeshark.co/) to collect traffic. If you don't
have Kubeshark already, CAST will download and install it for you as part
of deployment.

We currently only support Kubeshark version v41.6. If you would like to install
Kubeshark system-wide, you can follow the installation instructions
[found in Kubeshark's documentation](https://docs.kubeshark.co/en/install).

## Contributing

Check [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions on how to
contribute. In particular, you will need to sign our CLA as an individual
contributor, or have your employer sign it as a corporate entity.

If you have questions, concerns, or feedback you would like to provide, feel
free to [create an issue](https://github.com/corshatech/cast/issues/new/choose).

## Developing with CAST

Please see [DEVELOPING.md](./DEVELOPING.md) for instructions on setting up a
development environment, running CAST locally, and making code contributions.

## License

Licensed under the Apache License, Version 2.0 (the "License"); you
may not use this file except in compliance with the License.  You may
obtain a copy of the License at

> [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.  See the License for the specific language governing
permissions and limitations under the License.
