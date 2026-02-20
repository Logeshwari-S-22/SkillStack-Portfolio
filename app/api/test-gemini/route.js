// app/api/test-gemini/route.js
import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log("Testing OpenRouter with prompt:", prompt);

    const response = await askGemini(prompt, false);

    console.log("OpenRouter response received");

    return NextResponse.json({
      response,
    });
  } catch (error) {
    console.error("Test API error:", error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}