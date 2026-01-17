#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DanayFileConverterStack } from '../lib/danay-file-converter-stack';


const app = new cdk.App();
new DanayFileConverterStack(app, 'DanayFileConverterStack', {
/* Optional stack props */
});