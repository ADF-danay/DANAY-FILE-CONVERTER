import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'; 


export class DanayFileConverterStack extends cdk.Stack {
constructor(scope: Construct, id: string, props?: cdk.StackProps) {
super(scope, id, props);


// Source bucket where users upload documents
const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
removalPolicy: cdk.RemovalPolicy.DESTROY,
autoDeleteObjects: true,
// You can set server-side encryption or lifecycle rules here
});


// Destination bucket for converted PDFs
const destBucket = new s3.Bucket(this, 'DestBucket', {
removalPolicy: cdk.RemovalPolicy.DESTROY,
autoDeleteObjects: true,
});


// Lambda from Docker image (folder: lambda-image)
const converterFn = new lambda.DockerImageFunction(this, 'DanayConverterFn', {
code: lambda.DockerImageCode.fromImageAsset('lambda-image'),
memorySize: 2048,
timeout: cdk.Duration.minutes(5),
environment: {
DEST_BUCKET: destBucket.bucketName,
DEST_PREFIX: 'converted/'
}
});


// API Gateway -> Lambda (HTTP API)
const api = new apigateway.LambdaRestApi(this, 'DanayConverterApi', {
  handler: converterFn,
  restApiName: 'Danay File Converter Service',
  proxy: true, // all routes go to Lambda
});


// Permissions
sourceBucket.grantRead(converterFn);
destBucket.grantPut(converterFn);


// S3 -> Lambda notification
sourceBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(converterFn));


// Additional role policy for listing if needed
converterFn.addToRolePolicy(new iam.PolicyStatement({
actions: ['s3:ListBucket'],
resources: [sourceBucket.bucketArn]
}));


// Outputs
new cdk.CfnOutput(this, 'SourceBucketName', { value: sourceBucket.bucketName });
new cdk.CfnOutput(this, 'DestBucketName', { value: destBucket.bucketName });
new cdk.CfnOutput(this, 'ApiUrl', {
  value: api.url,
});
}
}