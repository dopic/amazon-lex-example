#!/bin/bash
sam build
sam package --output-template-file packaged.yaml --s3-bucket $1 --profile ${2:-default}
sam deploy --template-file packaged.yaml --stack-name PizzaOrderStack --profile ${2:-default} --capabilities CAPABILITY_IAM