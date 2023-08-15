import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from "aws-lambda";

import Stripe from "stripe";

import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { dynamoPut } from "./dynamoUtils";

export async function handler(
  event: APIGatewayProxyEvent,
  _: Context
): Promise<APIGatewayProxyResult> {
  const stripeSignature = event.headers["Stripe-Signature"];
  const eventPayload = event.body; // This is the raw payload from the webhook
  try {
    // Your function logic here
    const secretsManager = new SecretsManager();
    const secretName = process.env.STRIPE_SECREET_KEY_NAME; // Pass the secret name as an environment variable
    const dynamoDBTableName = process.env.DYNAMO_TABLE_NAME; // Pass the table name as an environment variable

    const secretValue = await secretsManager.getSecretValue({
      SecretId: secretName!
    });

    const stripeApiKey = secretValue.SecretString!;
    const stripe = new Stripe(stripeApiKey, {
      apiVersion: "2022-11-15"
    });

    const hookEvent = stripe.webhooks.constructEvent(
      eventPayload!,
      stripeSignature!,
      stripeApiKey
    );

    switch (hookEvent.type) {
      case "payment_intent.created":
        console.log("payment_intent.created");
        break;
      case "payment_intent.succeeded":
        const paymentIntent = hookEvent.data.object as Stripe.Charge;
        console.log("succeed!", paymentIntent);

        break;
      case "charge.succeeded":
        const chargeSucceeded = hookEvent.data.object as Stripe.Charge;
        console.log("charge was successful!", chargeSucceeded);
        // Extract payment information from the paymentIntent object
        const paymentAmount = chargeSucceeded?.amount;
        const paymentCurrency = chargeSucceeded?.currency;
        const paymentDescription = chargeSucceeded?.description;
        const shipping = chargeSucceeded.shipping;

        // Construct an item to be stored in DynamoDB
        await dynamoPut({
          chargeSucceeded,
          dynamoDBTableName: dynamoDBTableName!,
          paymentAmount,
          paymentCurrency,
          shipping: shipping!,
          paymentDescription: paymentDescription!
        });

        break;
      default:
        console.log(`Unhandled event type ${hookEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Success ` })
    };
  } catch (error) {
    console.log("error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error" })
    };
  }
}
