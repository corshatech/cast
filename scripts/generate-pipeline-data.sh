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

svc=$1
echo "service endpoint: $svc"

# kubeshark tap
kubeshark=`kubeshark tap -n cast "(httpbin*)" --set headless=true`
$kubeshark &


# create curl pod
kubectl create namespace curl
kubectl -n curl delete pod curl
kubectl run curl -n curl --image=curlimages/curl -- sleep 3600
kubectl wait --for=condition=Ready pod/curl -n curl

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
    kubectl exec -n curl curl -i -- curl -s -w "\n" "${svc}/base64/encode/${i}";
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
    kubectl exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Bearer ${i}" "${svc}/headers?q=1"
done

# # 2 Basic Auth
echo -e "\ninserting basic-auth data\n"
kubectl exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==" "${svc}/headers?q=1"
kubectl exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Basic G4sNcytKzXklcGVuIHNlc2FtZQ==" "${svc}/headers?q=1"

# 2 re-used auth tokens
echo -e "\ninserting reused-auth data\n"
kubectl exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token1" "${svc}/headers?q=1"
kubectl exec -n curl curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token2" "${svc}/headers?q=1"

kubectl create namespace curl2
kubectl -n curl2 delete pod curl
kubectl run curl -n curl2 --image=curlimages/curl -- sleep 3600
kubectl wait --for=condition=Ready pod/curl -n curl2

kubectl exec -n curl2 curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token1" "${svc}/headers?q=1"
kubectl exec -n curl2 curl -i -- curl -s -w "\n" -H "Authorization: Bearer dummy-token2" "${svc}/headers?q=1"


# delete curl namespaces
kubectl delete namespace curl
kubectl delete namespace curl2

echo -e "\nmock data insertion complete."
