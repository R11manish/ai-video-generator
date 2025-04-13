import { NextRequest, NextResponse } from "next/server";
import { sendToQueue } from "@/actions/sqsActions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, password } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Validate password
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Authentication failed. Invalid password." },
        { status: 401 }
      );
    }

    // Send the message to SQS
    const result = await sendToQueue(
      typeof message === "string" ? { message } : message,
      password
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error sending message to SQS:", error);
    return NextResponse.json(
      {
        error: `Failed to send message: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
