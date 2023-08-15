import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import { Construct } from "constructs";
import { StackProps } from "aws-cdk-lib";

interface APIGatewayStackProps extends StackProps {
  stripeWebhookLambda: cdk.aws_lambda.Function;
  stripePurchaseLambda: cdk.aws_lambda.Function;
}

export class APIGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: APIGatewayStackProps) {
    super(scope, id, props);

    const apiStripeGateway = new apigateway.RestApi(this, "StripeAPI", {
      restApiName: "Stripe API",
      description: "This API is for Stripe",
      deployOptions: {
        stageName: "prod"
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"] // Specify allowed headers
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      }
    });

    const stripePurchaseResource =
      apiStripeGateway.root.addResource("stripePurchase");
    const stripeWebhookResource =
      apiStripeGateway.root.addResource("stripeWebhooks");

    const stripePurchaseIntegration = new apigateway.LambdaIntegration(
      props.stripePurchaseLambda
    );
    const stripeWebhookIntegration = new apigateway.LambdaIntegration(
      props.stripeWebhookLambda
    );
    stripePurchaseResource.addMethod("POST", stripePurchaseIntegration);
    stripeWebhookResource.addMethod("POST", stripeWebhookIntegration);
  }
}
