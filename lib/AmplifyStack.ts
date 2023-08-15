import * as cdk from "aws-cdk-lib";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import { Construct } from "constructs";

export class AmplifyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
