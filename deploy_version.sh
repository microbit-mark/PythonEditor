#!/bin/bash
set -e
set -u
set -o pipefail

if [ ${CIRCLE_BRANCH} = 'master' ]
then
  BUCKET=stage.python.microbit.org
elif [ ${CIRCLE_BRANCH} = 'release' ]
then
  BUCKET=python.microbit.org
else
  BUCKET=${CIRCLE_BRANCH}.python-editor.microbit.org
fi

if ! aws s3api head-bucket --bucket ${BUCKET} > /dev/null 2>&1; then
  POLICY=$(mktemp)
  sed -e "s/{{BUCKET_NAME}}/${BUCKET}/g" policy.tmpl.json > $POLICY

  aws s3api create-bucket --bucket ${BUCKET} --region eu-west-1 --create-bucket-configuration LocationConstraint=eu-west-1
  aws s3 website s3://${BUCKET}/ --index-document index.html --error-document error.html
  aws s3api put-bucket-policy --bucket ${BUCKET} --policy "file://${POLICY}"
fi

aws s3 sync . s3://${BUCKET} --exclude ".git/*"
