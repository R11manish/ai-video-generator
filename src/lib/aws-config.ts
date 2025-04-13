import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";

const awsCredentials = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const dynamoClient = new DynamoDBClient(awsCredentials);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Create SQS client
const sqsClient = new SQSClient(awsCredentials);

export { docClient, sqsClient };
