import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from "aws-lambda";

import Stripe from "stripe";

import { SecretsManager } from "@aws-sdk/client-secrets-manager";

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const secretsManager = new SecretsManager();
    const secretName = process.env.STRIPE_SECREET_KEY_NAME; // Pass the secret name as an environment variable

    const secretValue = await secretsManager.getSecretValue({
      SecretId: secretName!
    });

    const stripeApiKey = secretValue.SecretString!;
    const stripe = new Stripe(stripeApiKey, {
      apiVersion: "2022-11-15"
    });

    // Parse the POST request body
    if (!event.body) {
      console.log("event empty", event.body);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error" })
      };
    }
    const { productID } = JSON.parse(event.body);

    // Access data from the POST request body

    const { data } = await stripe.prices.list({ product: productID });

    const product = data.filter((item) => item.product === productID);

    if (!product?.[0] || !product?.[0].unit_amount)
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error" })
      };

    const paymentIntent = await stripe.paymentIntents.create({
      amount: product?.[0].unit_amount,
      currency: data[0].currency,
      metadata: { infoOnCustomer: "123" },
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
      body: JSON.stringify({ secret: paymentIntent.client_secret })
    };
  } catch (error) {
    console.log("error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error: ${(error as Error).message}` })
    };
  }
}
