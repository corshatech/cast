
# CAST

![Go Coverage](https://img.shields.io/badge/Go%20Coverage-43.3%25-red)
![Node
Coverage](https://img.shields.io/badge/Node%20Coverage-79.59%25-yellow)

CAST is an API security tool being developed to evaluate Kubernetes
API traffic for authentication vulnerabilities such as reused
credentials.

Deployed as a Helm package, CAST produces a web report of API
vulnerabilities and does not store or export any un-hashed
cryptographic material.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Evaluated Security Concerns](#evaluated-security-concerns)
  - [Credential Reuse](#credential-reuse)
- [Prerequisites](#prerequisites)
- [Install CAST](#install-cast)
  - [Kubeshark](#kubeshark)
- [Contributing](#contributing)
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

## Prerequisites

- Kubernetes 1.21+
- Helm 3.8+
- Docker 20.10+

## Install CAST

The CAST binary can be downloaded from the [Releases](https://github.com/corshatech/cast/releases)
page. To use the CAST CLI to analyze traffic in a namespace, run

```bash
cast -n <namespace>
```

Once you run the CLI, the CAST UI will open in your browser at [localhost:3000](http://localhost:3000/).

The ```cast``` command can be used with the following flags.

```bash
Usage:
  cast -n [namespace] [flags]

Flags:
  -h, --help                  help for cast
      --kube-config string    Path to kube config file. (default "$HOME/.kube/config")
      --kube-context string   Kube context to deploy CAST into.
  -n, --namespace string      The namespace to analyze. (default "all")
```

### Kubeshark

CAST uses Kubeshark 37.0. If you would like to install Kubeshark system wide, the
binary can be downloaded from the release page: [Kubeshark Release
37.0](https://github.com/kubeshark/kubeshark/releases/tag/37.0). Otherwise, CAST
will install the Kubeshark binary in the app's private config directory.  

More information about installing Kubeshark can be found on their
site: [Kubeshark Installation](https://docs.kubeshark.co/en/install).
NOTE: the instructions are for the latest version of Kubeshark, not
37.0 .

## Contributing

Check [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions on how to
contribute and developer workflows.

If you have questions you would like to ask the developers, or
feedback you would like to provide, feel free to create an issue on
our issue tracker.

Additionally, if you have a feature you would like to suggest, feel
free to create an issue on our issue tracker.

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
