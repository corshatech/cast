#!/bin/sh

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

# kubeshark tap
nohup kubeshark --set kube.context="${CONTEXT}" tap -n cast "(httpbin*)" --set headless=true > kubeshark.out 2> kubeshark.err < /dev/null &
./scripts/generate-pipeline-data.sh ${svc}
