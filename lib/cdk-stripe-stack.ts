import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import { Construct } from "constructs";

export class CdkStripeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stripePurchaes = new dynamodb.Table(this, "stripePurchases", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING
      }
    });

    const secretEndPoint = sm.Secret.fromSecretAttributes(
      this,
      "ImportedSecretEndpoint",
      {
        secretCompleteArn:
          "arn:aws:secretsmanager:us-east-2:127847013811:secret:stripesecret-E5HqUr"
      }
    );

    const secretStripeKey = sm.Secret.fromSecretAttributes(
      this,
      "ImportedStripeKey",
      {
        secretCompleteArn:
          "arn:aws:secretsmanager:us-east-2:127847013811:secret:STRIPE_SECRET_KEY-nkkt40"
      }
    );

    const stripeWebhookLambda = new lambda.Function(this, "stripewebhook", {
      handler: "index.handler",
      code: lambda.Code.fromAsset("functions/stripewebhook"),
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        DYNAMO_TABLE_NAME: stripePurchaes.tableName,
        STRIPE_SECREET_KEY_NAME: secretEndPoint.secretName
      } // Adjust the runtime if necessary
    });

    const stripePurchaseLambda = new lambda.Function(this, "stripePurchase", {
      handler: "index.handler",
      code: lambda.Code.fromAsset("functions/stripePurchase"),
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        STRIPE_SECREET_KEY_NAME: secretStripeKey.secretName
      } // Adjust the runtime if necessary
    });

    secretEndPoint.grantRead(stripeWebhookLambda);

    secretStripeKey.grantRead(stripePurchaseLambda);

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
      stripePurchaseLambda
    );
    const stripeWebhookIntegration = new apigateway.LambdaIntegration(
      stripeWebhookLambda
    );
    stripePurchaseResource.addMethod("POST", stripePurchaseIntegration);
    stripeWebhookResource.addMethod("POST", stripeWebhookIntegration);

    stripePurchaes.grantReadWriteData(stripeWebhookLambda);

    const amplifyApp = new amplify.App(this, "stripeapp", {
      environmentVariables: {
        STRIPE_KEY:
          "pk_test_30ADhx7uM8yUYIKlELPT4j2ipb59hnfpmX88PDC69uXQ4NXgDgox6VYCJTe60uAhrQZnxuUuKhm5A9PZORh1EjeGP00mtm3IHPv"
      },
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        repository: "stripe-nuxt-example-amplify",
        owner: "erikch",
        oauthToken: cdk.SecretValue.secretsManager("github-token")
      })
    });

    amplifyApp.addBranch("main");
  }
}
