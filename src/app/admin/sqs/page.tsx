"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { sendToQueue } from "@/actions/sqsActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SQSAdminPage() {
  const [password, setPassword] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const router = useRouter();

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast.error("Topic cannot be empty");
      return;
    }

    if (!password.trim()) {
      toast.error("Password is required to send messages");
      return;
    }

    setIsSending(true);

    try {
      const messageBody = { topic: topic + "history" };
      const result = await sendToQueue(messageBody, password);

      if (result.success) {
        toast.success(result.message);
        setTopic("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">SQS Management Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Send Message to SQS Queue</CardTitle>
          <CardDescription>
            Simply enter a topic to send to the video-generation-queue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSendMessage}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="Enter topic (e.g., Shoaib Akhtar history)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your message will be formatted as:{" "}
                  {`{"topic": "${topic || "example topic"}"}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password is required for sending messages to the queue
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              type="button"
            >
              Back to Home
            </Button>
            <Button
              type="submit"
              disabled={isSending || !topic.trim() || !password.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send to Queue"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
