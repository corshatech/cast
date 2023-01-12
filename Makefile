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

VERSION ?= "0.1.0-pre"
GITSHA ?= "`git rev-parse HEAD`"

all: tidy test lint image chart

test:
	$(GO) test -coverprofile=coverage.out ./...

image:
	skaffold build -t ${VERSION} --default-repo=ghcr.io/corshatech/cast

cast:
	GOOS=linux GOARCH=amd64 $(GO) build ${LDFLAGS} -gcflags="all=-N -l" -o build/package/collector ./collector

tidy:
	$(GO) mod tidy

lint: lint-helm
	golangci-lint run --verbose --deadline=5m

lint-helm:
	helm dependency update k8s/helm/cast
	helm lint k8s/helm/cast

super-linter:
	docker run --rm \
    -e RUN_LOCAL=true \
	-e USE_FIND_ALGORITHM=true \
    --env-file "super-linter.env" \
    -v $(PWD):/tmp/lint github/super-linter:slim-v4

clean:
	$(GO) clean ./...
	$(RM) -rf build

.PHONY: all test cast tidy lint lint-helm
