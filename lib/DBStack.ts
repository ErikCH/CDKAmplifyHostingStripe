import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DBStack extends cdk.Stack {
  stripePurchasesTable: dynamodb.Table;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stripePurchasesTable = new dynamodb.Table(this, "stripePurchases", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING
      }
    });

    this.stripePurchasesTable = stripePurchasesTable;
  }
}
