import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  buildCandidatePrompt,
  MAX_MESSAGE_CHARS,
  MAX_MESSAGES,
  MAX_RESUME_CHARS,
  type ChatMessage,
} from "@/lib/interview";

export const runtime = "nodejs";

type ChatRequest = {
  resumeText?: unknown;
  messages?: unknown;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_MESSAGE_CHARS
  );
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Add OPENAI_API_KEY to your .env.local file to enable interview answers." },
      { status: 503 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body.resumeText !== "string" ||
    body.resumeText.trim().length === 0 ||
    body.resumeText.length > MAX_RESUME_CHARS
  ) {
    return NextResponse.json({ error: "Upload a readable resume before starting an interview." }, { status: 400 });
  }

  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > MAX_MESSAGES ||
    !body.messages.every(isChatMessage) ||
    body.messages[body.messages.length - 1]?.role !== "user"
  ) {
    return NextResponse.json({ error: "Send a valid interview question to continue." }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: buildCandidatePrompt(body.resumeText) },
        ...body.messages,
      ],
      temperature: 0.6,
      max_tokens: 350,
    });

    const answer = response.choices[0]?.message.content?.trim();
    if (!answer) {
      return NextResponse.json(
        { error: "The model returned an empty answer. Please try asking again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Interview chat request failed:", error);
    return NextResponse.json(
      { error: "The interview assistant couldn't respond. Check your API configuration and try again." },
      { status: 502 },
    );
  }
}
