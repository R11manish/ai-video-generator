"use server";

import {
  SendMessageCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { sqsClient } from "@/lib/aws-config";
import { QUEUE_NAME } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limiter";

interface SQSMessage {
  messageId?: string;
  body: unknown;
  receiptHandle?: string;
}

// Rate limit configuration
const VIDEO_GEN_RATE_LIMIT = {
  maxRequests: 5,
  windowInSeconds: 60,
};

export async function sendToQueue(
  messageBody: Record<string, unknown>,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify password
    if (password !== process.env.ADMIN_PASSWORD) {
      return {
        success: false,
        message: "Authentication failed. Invalid password.",
      };
    }

    // Rate limiting check
    const identifier = Buffer.from(password).toString("base64");
    const rateLimitResult = await checkRateLimit({
      key: "video-gen",
      identifier,
      maxRequests: VIDEO_GEN_RATE_LIMIT.maxRequests,
      windowInSeconds: VIDEO_GEN_RATE_LIMIT.windowInSeconds,
    });

    // If rate limit exceeded
    if (!rateLimitResult.success) {
      return {
        success: false,
        message: `Rate limit exceeded. Maximum ${rateLimitResult.limit} requests allowed per ${VIDEO_GEN_RATE_LIMIT.windowInSeconds} seconds. Please try again in ${rateLimitResult.resetIn} seconds.`,
      };
    }

    // First, get the queue URL
    const queueUrlResponse = await sqsClient.send(
      new GetQueueUrlCommand({
        QueueName: QUEUE_NAME,
      })
    );

    if (!queueUrlResponse.QueueUrl) {
      return {
        success: false,
        message: "Failed to retrieve queue URL.",
      };
    }

    // Send message to the queue
    const sendResponse = await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrlResponse.QueueUrl,
        MessageBody: JSON.stringify(messageBody),
        MessageAttributes: {
          MessageType: {
            DataType: "String",
            StringValue: "VideoGeneration",
          },
        },
      })
    );

    return {
      success: true,
      message: `Message sent successfully. MessageId: ${sendResponse.MessageId}. Remaining requests: ${rateLimitResult.remaining}.`,
    };
  } catch (error) {
    console.error("Error sending message to SQS:", error);
    return {
      success: false,
      message: `Failed to send message: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Retrieves messages from the SQS queue
 */
export async function receiveFromQueue(
  password: string
): Promise<{ success: boolean; messages?: SQSMessage[]; message: string }> {
  try {
    // Verify password
    if (password !== process.env.ADMIN_PASSWORD) {
      return {
        success: false,
        message: "Authentication failed. Invalid password.",
      };
    }

    const queueUrlResponse = await sqsClient.send(
      new GetQueueUrlCommand({
        QueueName: QUEUE_NAME,
      })
    );

    if (!queueUrlResponse.QueueUrl) {
      return {
        success: false,
        message: "Failed to retrieve queue URL.",
      };
    }

    const receiveResponse = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrlResponse.QueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
        MessageAttributeNames: ["All"],
      })
    );

    if (!receiveResponse.Messages || receiveResponse.Messages.length === 0) {
      return {
        success: true,
        messages: [],
        message: "No messages available in the queue.",
      };
    }

    const parsedMessages = receiveResponse.Messages.map((msg) => {
      try {
        return {
          messageId: msg.MessageId,
          body: JSON.parse(msg.Body || "{}"),
          receiptHandle: msg.ReceiptHandle,
        };
      } catch (e) {
        return {
          messageId: msg.MessageId,
          body: msg.Body,
          receiptHandle: msg.ReceiptHandle,
        };
      }
    });

    return {
      success: true,
      messages: parsedMessages,
      message: `Retrieved ${parsedMessages.length} message(s) from the queue.`,
    };
  } catch (error) {
    console.error("Error receiving messages from SQS:", error);
    return {
      success: false,
      message: `Failed to receive messages: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function deleteMessage(
  receiptHandle: string | undefined,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!receiptHandle) {
      return {
        success: false,
        message: "Cannot delete message: Receipt handle is missing",
      };
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return {
        success: false,
        message: "Authentication failed. Invalid password.",
      };
    }

    const queueUrlResponse = await sqsClient.send(
      new GetQueueUrlCommand({
        QueueName: QUEUE_NAME,
      })
    );

    if (!queueUrlResponse.QueueUrl) {
      return {
        success: false,
        message: "Failed to retrieve queue URL.",
      };
    }

    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrlResponse.QueueUrl,
        ReceiptHandle: receiptHandle,
      })
    );

    return {
      success: true,
      message: "Message deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting message from SQS:", error);
    return {
      success: false,
      message: `Failed to delete message: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
