import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jwtVerify } from "jose";
import User from "@/models/User";
import { askGemini } from "@/lib/gemini";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "skillstacktn_super_secret_key_2024"
);

export async function GET(req) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const tokenMatch = cookies.match(/auth-token=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verified = await jwtVerify(token, SECRET);
    const userId = verified.payload.userId;

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build profile summary for AI analysis
    const educationSummary = user.education?.map(e => 
      `${e.degree} in ${e.fieldOfStudy} from ${e.school} (${e.isCurrentlyStudying ? "Currently Studying" : e.endDate})`
    ).join("\n") || "No education listed";

    const experienceSummary = user.experience?.map(e => 
      `${e.position} at ${e.company} (${e.employmentType}) - ${e.isCurrentlyWorking ? "Currently working" : e.endDate}`
    ).join("\n") || "No work experience listed";

    const skillsSummary = user.skills?.map(s => `${s.name} (${s.proficiency})`).join(", ") || "No skills listed";

    const prompt = `You are a professional career coach and skill development advisor.

Analyze this user's profile and provide comprehensive recommendations:

NAME: ${user.name}
HEADLINE: ${user.headline || "Not specified"}
BIO: ${user.bio || "Not specified"}
LOCATION: ${user.location || "Not specified"}

EDUCATION:
${educationSummary}

WORK EXPERIENCE:
${experienceSummary}

SKILLS:
${skillsSummary}

ASSESSMENTS COMPLETED: ${user.totalAssessmentsTaken || 0}
AVERAGE SCORE: ${user.averageScore || 0}%
EXPERIENCE POINTS: ${user.xp || 0}

Provide ONLY this JSON response:
{
  "summary": "2-3 sentence summary of their career profile",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasToImprove": ["area1", "area2"],
  "recommendedSkills": ["skill1", "skill2", "skill3"],
  "careerPathSuggestion": "Your recommended next career step",
  "actionItems": [
    "1. Action 1",
    "2. Action 2",
    "3. Action 3"
  ],
  "guidance": "Detailed personalized guidance message"
}`;

    const result = await askGemini(prompt, true);

    return NextResponse.json({
      summary: result.summary || "Profile analysis in progress...",
      strengths: result.strengths || [],
      areasToImprove: result.areasToImprove || [],
      recommendedSkills: result.recommendedSkills || [],
      careerPathSuggestion: result.careerPathSuggestion || "",
      actionItems: result.actionItems || [],
      guidance: result.guidance || "",
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}