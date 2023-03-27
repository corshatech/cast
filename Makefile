# Copyright 2022 Corsha.
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#      http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations.

GO = GOPRIVATE=github.com/corshatech/* GO111MODULE=on go

VERSION ?= "0.1.0"

all: tidy test lint image markdown

test: test-go test-ui

test-go:
	$(GO) test -coverprofile=coverage.out ./...

test-ui:
	cd ui && npm ci && npm run "test:ci"

images:
	skaffold build -t ${VERSION} --default-repo=ghcr.io/corshatech/cast

cast:
	$(GO) build -gcflags="all=-N -l" -o build/package/cast cast.go

tidy:
	$(GO) mod tidy

lint: lint-ui lint-go lint-helm lint-markdown

lint-helm:
	helm dependency update k8s/helm/cast
	helm lint k8s/helm/cast

lint-ui:
	cd ./ui && npm ci && npm run lint

lint-go:
	golangci-lint run --verbose --deadline=5m

markdown:
	cd ui && npm ci
	./ui/node_modules/.bin/doctoc README.md --github --title "## Table of Contents"

lint-markdown:
	cd ui && npm ci
	./ui/node_modules/.bin/markdownlint-cli2-config .markdownlint.yaml "**/*.md" "#ui/node_modules" "#.github"

clean:
	$(GO) clean ./...
	$(RM) -rf build

# remove cast deployment resources
cast-clean:
	kubectl delete ns cast
	kubeshark clean

.PHONY: all test cast tidy lint lint-helm
