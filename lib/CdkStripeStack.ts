import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { StackProps } from "aws-cdk-lib";

interface CdkStripeStackProps extends StackProps {
  stripePurchasesTable: dynamodb.Table;
}

export class CdkStripeStack extends cdk.Stack {
  stripeWebhookLambda: cdk.aws_lambda.Function;
  stripePurchaseLambda: cdk.aws_lambda.Function;
  constructor(scope: Construct, id: string, props: CdkStripeStackProps) {
    super(scope, id, props);

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
        DYNAMO_TABLE_NAME: props.stripePurchasesTable.tableName,
        STRIPE_SECREET_KEY_NAME: secretEndPoint.secretName
      }
    });

    const stripePurchaseLambda = new lambda.Function(this, "stripePurchase", {
      handler: "index.handler",
      code: lambda.Code.fromAsset("functions/stripePurchase"),
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        STRIPE_SECREET_KEY_NAME: secretStripeKey.secretName
      }
    });

    secretStripeKey.grantRead(stripePurchaseLambda);
    secretEndPoint.grantRead(stripeWebhookLambda);

    props.stripePurchasesTable.grantReadWriteData(stripeWebhookLambda);

    this.stripePurchaseLambda = stripePurchaseLambda;
    this.stripeWebhookLambda = stripeWebhookLambda;
  }
}
