#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkStripeStack } from "../lib/CdkStripeStack";
import { APIGatewayStack } from "../lib/APIGatewayStack";
import { AmplifyStack } from "../lib/AmplifyStack";
import { DBStack } from "../lib/DBStack";

const app = new cdk.App();

const dbStack = new DBStack(app, "DBStack");
const cdkApp = new CdkStripeStack(app, "CdkStripeStack", {
  stripePurchasesTable: dbStack.stripePurchasesTable
});

new APIGatewayStack(app, "APIGatewayStack", {
  stripePurchaseLambda: cdkApp.stripePurchaseLambda,
  stripeWebhookLambda: cdkApp.stripeWebhookLambda
});

new AmplifyStack(app, "AmplifyStack");
