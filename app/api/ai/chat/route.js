import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jwtVerify } from "jose";
import User from "@/models/User";
import { askGemini } from "@/lib/gemini";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "skillstacktn_super_secret_key_2024"
);

export async function POST(req) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const tokenMatch = cookies.match(/auth-token=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verified = await jwtVerify(token, SECRET);
    const userId = verified.payload.userId;

    const { message, profile, recommendations } = await req.json();

    // Create contextual prompt
    const systemPrompt = `You are a helpful AI career coach and technical mentor. 
The user's profile:
- Name: ${profile?.name}
- Skills: ${profile?.skills?.map((s) => s.name).join(", ")}
- Current Role: ${profile?.headline}
- Location: ${profile?.location}
- Assessments: ${profile?.totalAssessmentsTaken} taken with ${profile?.averageScore}% average

Their recommendations:
- Strong in: ${recommendations?.strongSkills?.join(", ")}
- Should improve: ${recommendations?.skillsToImprove?.join(", ")}
- Recommended to learn: ${recommendations?.recommendedSkills?.join(", ")}

Provide helpful, personalized advice. Be encouraging and constructive.`;

    const fullPrompt = `${systemPrompt}\n\nUser question: ${message}`;

    const response = await askGemini(fullPrompt, false);

    // Save to chat history
    await connectDB();
    await User.findByIdAndUpdate(userId, {
      $push: {
        chatHistory: {
          userMessage: message,
          aiResponse: response,
          timestamp: new Date(),
        },
      },
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}