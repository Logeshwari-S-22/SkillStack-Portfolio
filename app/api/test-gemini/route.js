import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    const response = await askGemini(prompt, false);
    return NextResponse.json({ response });
  } catch (err) {
    console.error("Gemini test error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}