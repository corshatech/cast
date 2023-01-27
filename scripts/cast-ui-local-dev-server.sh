#!/bin/bash

# Copyright 2022 Corsha.
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#      http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "${SCRIPT_DIR}/.."

if ! command -v "docker" >/dev/null 2>&1
then
    echo "Couldn't find the Docker command."
    echo "You need Docker (or podman aliased as docker) for this."
    exit 1
fi

if [ -n "$(docker ps -q --filter "name=cast-db")" ] >/dev/null 2>&1
then
    echo "Cast dev DB is already running in the background. If you intended to stop it, use:"
    echo "docker rm -f -v cast-db"
    exit 1
fi

mkdir -p "./.scratch/sql"
cp "./k8s/helm/cast/files/init.sql" "./.scratch/sql/a.sql"
cp "./sql/sample-data/traffic.sql" "./.scratch/sql/b.sql"

if ! CONTAINER="$(docker run --rm --detach --name cast-db \
    -v "$(pwd)/.scratch/sql:/docker-entrypoint-initdb.d" \
    -e POSTGRESQL_PASSWORD=password \
    -e POSTGRESQL_USERNAME=postgres \
    -e POSTGRESQL_DATABASE=traffic \
    --platform "linux/amd64" \
    -p 127.0.0.1:5432:5432 \
    bitnami/postgresql:15)"
then
    echo "Unable to start container..."
    echo "$CONTAINER"
    exit 1
fi

cat > ./ui/.env.local <<HERE
PGUSER=postgres
PGPASSWORD=password
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=traffic
HERE

echo "Created and started CAST dev db."
echo "UI development should now work, do \`cd $(pwd)/ui && npm run dev\`"
echo "Docker container: $CONTAINER"
echo "To stop the db use: \`docker rm -f -v cast-db\`"
