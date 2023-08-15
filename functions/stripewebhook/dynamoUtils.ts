import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
  PutItemInput
} from "@aws-sdk/client-dynamodb";

import Stripe from "stripe";
const client = new DynamoDBClient();

export async function dynamoPut({
  chargeSucceeded,
  paymentAmount,
  paymentCurrency,
  paymentDescription,
  shipping,
  dynamoDBTableName
}: {
  chargeSucceeded: Stripe.Charge;
  paymentAmount: number;
  paymentCurrency: string;
  paymentDescription?: string;
  shipping: Stripe.Charge.Shipping;
  dynamoDBTableName: string;
}) {
  const dynamoDBItem: PutItemInput["Item"] = {
    id: { S: chargeSucceeded.id },
    amount: { N: paymentAmount.toString() },
    currency: { S: paymentCurrency },
    description: { S: paymentDescription || "description" },
    timestamp: { S: new Date().toISOString() },
    shipping: { S: JSON.stringify(shipping) }
  };
  console.log("sending", dynamoDBItem);

  const params: PutItemCommandInput = {
    TableName: dynamoDBTableName,
    Item: dynamoDBItem
  };
  const command = new PutItemCommand(params);

  await client.send(command);
}
