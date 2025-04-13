import { NextRequest, NextResponse } from "next/server";
import {
  ScanCommand,
  ScanCommandInput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { docClient } from "@/lib/aws-config";
import { unmarshall } from "@aws-sdk/util-dynamodb";

type DynamoDBKey = Record<string, AttributeValue>;

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    // Get lastEvaluatedKey from query if it exists
    const lastKeyParam = searchParams.get("lastKey");
    let lastEvaluatedKey: DynamoDBKey | undefined;

    if (lastKeyParam) {
      try {
        lastEvaluatedKey = JSON.parse(
          decodeURIComponent(lastKeyParam)
        ) as DynamoDBKey;
      } catch (e) {
        console.error("Error parsing lastKey:", e);
      }
    }

    // Scan the ai_videos table with pagination
    const scanParams: ScanCommandInput = {
      TableName: "ai_videos",
      Limit: limit,
    };

    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    const response = await docClient.send(new ScanCommand(scanParams));

    // Map the DynamoDB items to Video objects
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
        };
      }) || [];

    return NextResponse.json({
      videos,
      lastEvaluatedKey: response.LastEvaluatedKey as DynamoDBKey | undefined,
      hasMore: !!response.LastEvaluatedKey,
    });
  } catch (error) {
    console.error("Error fetching videos from DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
