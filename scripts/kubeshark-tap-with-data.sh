#!/bin/bash

# Copyright 2023 Corsha.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#      http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# script to start kubeshark tap then call script to generate pipeline data
# intended for use with skaffold dev server as post deploy hook

svc=$1
KUBESHARK_SUPPORTED_VERSION="41.6"

if ! [ -x "$(command -v kubeshark)" ]; then
    echo >&2 "ERROR: kubeshark is not installed, visit https://kubeshark.co/ to install"
    exit 1
fi

KUBESHARK_VERSION="$(kubeshark version 2>&1)"
if [ "$KUBESHARK_VERSION" != "$KUBESHARK_SUPPORTED_VERSION" ]; then
    kubeshark version
    echo "ERROR: incorrect version of kubeshark installed, please install $KUBESHARK_SUPPORTED_VERSION"
    exit 1
fi

if ! [ -f "$KUBESHARK_HELM_CHART_PATH" ]; then
    echo "ERROR: Must set the variable \$KUBESHARK_HELM_CHART_PATH to the path"
    echo "of the Kubeshark $KUBESHARK_SUPPORTED_VERSION Helm chart .tgz file."
    exit 1
fi

# clean up any existing kubeshark install
kubeshark clean --set kube.context="${CONTEXT}" || true

# kubeshark tap
nohup kubeshark \
    --set kube.context="${CONTEXT}" \
    tap \
    -n cast "(httpbin*)" \
    --set headless=true \
    --set tap.docker.registry="ghcr.io/corshatech/kubeshark" \
    --set tap.docker.tag="corshav41.6"\
    > kubeshark.out 2> kubeshark.err < /dev/null &


# Waiting for collector pod successfully connect to postgres and kubeshark
collector=$(kubectl --context="${CONTEXT}" get pods --namespace=cast | grep cast-collector | cut -d' ' -f1)
while ! kubectl --context="${CONTEXT}" logs -n cast "${collector}"|grep -q "Starting export of records." ; do
    echo "Waiting for collector to be ready."
    sleep 10;
done

# generate mock data
export CAST_FAST_DATA_ONLY="${CAST_FAST_DATA_ONLY:-true}"
yes | ./scripts/generate-pipeline-data.sh ${svc}
