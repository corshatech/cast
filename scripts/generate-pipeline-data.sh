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

# Script to generate mock data for CAST

# configure the local environment to work with the skaffold

svc=$1
echo "service endpoint: $svc"

export CONTEXT="docker-desktop"

# kubeshark tap
nohup kubeshark --set kube.context="${CONTEXT}" tap -n cast "(httpbin*)" --set headless=true > kubeshark.out 2> kubeshark.err < /dev/null &


# Waiting for collector pod successfully connect to postgres and kubeshark
collector=$(kubectl --context="${CONTEXT}" get pods --namespace=cast | grep cast-collector | cut -d' ' -f1)
while ! kubectl --context="${CONTEXT}" logs -n cast ${collector}|grep -q "Starting export of records." ;do echo "Waiting for collector to be ready.\n";sleep 10;done

# create curl pod
kubectl --context="${CONTEXT}" create namespace curl
kubectl --context="${CONTEXT}" -n curl delete pod curl
kubectl --context="${CONTEXT}" run curl -n curl --image=curlimages/curl -- sleep 3600
kubectl --context="${CONTEXT}" wait --for=condition=Ready pod/curl -n curl

# password in url
echo -e "\ninserting pass-in-url data\n"
arr=(
    "password?password=xyzzy"
    "pass?pass=xyzzy"
    "auth?auth=xyzzy"
    "pass2x?pass=xyzzy&pass=xyzzy2"
    "pass1x1?pass=xyzzy&password=xyzzy2"
    )

for i in "${arr[@]}"
do
    kubectl --context="${CONTEXT}" exec -n curl curl -i -- curl -s -w "\n" "${svc}/base64/encode/${i}";
done

# 2 expired jwts, 2 unexpired jwts
echo -e "\ninserting expired-jwt data\n"
jwts=(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE2NzI0MjM5NjJ9.FaOoRpL28jWo9P41BNCYzx1lbESJd-pn_Vp6_REGQEg" 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjEyNjU3NTA0Njd9.yf73iGwy_ztPAZiKSc-qgtvBFNGQdKfRrOF7vrCp4j8"
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIsInRlc3QiOiJ0ZXN0In0.XtSo2lOAEjh1BnGejrCUY3y3F2A7p7ByFGA_4m3Iq-s"
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDJ9.UqRu8fGnUAmn-Z_wwsgGVNTXANkIiDdEbj-BdZRafks"
    )

for i in "${jwts[@]}"
do
    kubectl --context="${CONTEXT}" exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Bearer ${i}" "${svc}/headers?q=1"
done

# # 2 Basic Auth
echo -e "\ninserting basic-auth data\n"
kubectl --context="${CONTEXT}" exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==" "${svc}/headers?q=1"
kubectl --context="${CONTEXT}" exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Basic G4sNcytKzXklcGVuIHNlc2FtZQ==" "${svc}/headers?q=1"

# 2 re-used auth tokens
echo -e "\ninserting reused-auth data\n"
kubectl --context="${CONTEXT}" exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token1" "${svc}/headers?q=1"
kubectl --context="${CONTEXT}" exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token2" "${svc}/headers?q=1"

kubectl --context="${CONTEXT}" create namespace curl2
kubectl --context="${CONTEXT}" -n curl2 delete pod curl
kubectl --context="${CONTEXT}" run curl -n curl2 --image=curlimages/curl -- sleep 3600
kubectl --context="${CONTEXT}" wait --for=condition=Ready pod/curl -n curl2

kubectl --context="${CONTEXT}" exec -n curl2 curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token1" "${svc}/headers?q=1"
kubectl --context="${CONTEXT}" exec -n curl2 curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token2" "${svc}/headers?q=1"


# delete curl namespaces
kubectl --context="${CONTEXT}" delete namespace curl --wait=false --force --grace-period=0
kubectl --context="${CONTEXT}" delete namespace curl2 --wait=false --force --grace-period=0

echo -e "\nmock data insertion complete."
exit 0
