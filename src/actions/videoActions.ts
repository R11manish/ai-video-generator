"use server";

import {
  ScanCommand,
  ScanCommandInput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { docClient } from "@/lib/aws-config";
import { Video } from "@/types/video";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export type DynamoDBKey = Record<string, AttributeValue>;

export async function getVideos(
  lastEvaluatedKey?: DynamoDBKey,
  limit: number = 5
): Promise<{
  videos: Video[];
  lastEvaluatedKey?: DynamoDBKey;
}> {
  try {
    const scanParams: ScanCommandInput = {
      TableName: "ai_videos",
      Limit: limit,
    };

    // Add the ExclusiveStartKey if we have a lastEvaluatedKey
    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    const response = await docClient.send(new ScanCommand(scanParams));

    const videos =
      response.Items?.map((item) => {
        const unmarshalled = unmarshall(item);
        return {
          id: unmarshalled.id || "",
          url: unmarshalled.url || "",
          caption: unmarshalled.title || "", // Map 'title' to 'caption'
          username: `@user${unmarshalled.id.slice(0, 4)}`, // Create a username from the ID
          likes: Math.floor(Math.random() * 5000), // Add random likes
          comments: Math.floor(Math.random() * 500), // Add random comments
        } as Video;
      }) || [];

    return {
      videos,
      lastEvaluatedKey: response.LastEvaluatedKey as DynamoDBKey | undefined,
    };
  } catch (error) {
    console.error("Error fetching videos from DynamoDB:", error);
    return { videos: [] };
  }
}
