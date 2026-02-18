import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { askGemini } from "@/lib/gemini";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.NEXTAUTH_SECRET); }
  catch { return null; }
}

// POST → extract skills from project description or certificate title
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text, source } = await req.json();
    // source = "project" | "certificate" | "manual"

    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    // Ask Gemini to extract skills
    const prompt = `You are a tech skill extractor for a developer portfolio platform called SkillVault.

Analyze this ${source === "project" ? "project description" : source === "certificate" ? "certificate title" : "skill input"}:
"${text}"

Extract all technical skills mentioned or implied. For each skill determine the proficiency level based on context.

Rules:
- Only include REAL technical skills (programming languages, frameworks, tools, platforms, concepts)
- Do NOT include soft skills (communication, teamwork, etc.)
- Do NOT include non-technical skills (cooking, sports, etc.)
- If it's a certificate like "AWS Solutions Architect", extract implied skills too
- Maximum 8 skills per extraction

Return JSON in this exact format:
{
  "skills": [
    { "name": "React", "level": "Intermediate" },
    { "name": "Node.js", "level": "Beginner" }
  ],
  "isValid": true,
  "message": "Found 2 technical skills"
}

Level must be one of: "Beginner", "Intermediate", "Advanced", "Expert"
If no valid tech skills found, return: { "skills": [], "isValid": false, "message": "No technical skills detected" }`;

    const result = await askGemini(prompt, true);

    if (!result.isValid || result.skills.length === 0) {
      return NextResponse.json({
        skills: [],
        message: result.message || "No technical skills detected",
      });
    }

    // Auto-add detected skills to user profile
    await connectDB();
    const user = await User.findById(decoded.id);
    let added = 0;

    for (const skill of result.skills) {
      // Skip if already exists
      const exists = user.skills.find(
        s => s.name.toLowerCase() === skill.name.toLowerCase()
      );
      if (!exists) {
        user.skills.push({
          name: skill.name,
          level: skill.level,
          source: source || "ai-detected",
        });
        user.xp += 5; // 5 XP per auto-detected skill
        added++;
      }
    }

    if (added > 0) await user.save();

    return NextResponse.json({
      skills: result.skills,
      added,
      message: `Detected ${result.skills.length} skills, added ${added} new ones`,
      totalSkills: user.skills.length,
    });

  } catch (err) {
    console.error("Detect skills error:", err.message);
    return NextResponse.json({ error: "AI skill detection failed" }, { status: 500 });
  }
}