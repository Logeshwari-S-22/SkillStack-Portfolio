import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import LearningPlan from "@/models/LearningPlan";
import { askGemini } from "@/lib/gemini";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.NEXTAUTH_SECRET); }
  catch { return null; }
}

export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetRole } = await req.json();
    if (!targetRole) return NextResponse.json({ error: "Target role required" }, { status: 400 });

    await connectDB();
    const user = await User.findById(decoded.id);

    // Build user profile summary
    const skillsSummary = user.skills.map(s => `${s.name} (${s.level}${s.verified ? ", verified" : ""})`).join(", ");
    const projectsSummary = user.projects.map(p => `${p.title}: ${p.description?.slice(0, 80)}`).join("; ");
    const certsSummary = user.certifications.map(c => `${c.title} by ${c.issuer}`).join(", ");

    const prompt = `You are an expert tech career advisor for SkillVault platform.

Analyze this developer's profile:
Name: ${user.name}
Target Role: ${targetRole}
Current Skills: ${skillsSummary || "None listed"}
Projects: ${projectsSummary || "None listed"}
Certifications: ${certsSummary || "None listed"}

Provide a comprehensive career analysis. Return ONLY this JSON:
{
  "careerMatch": [
    {
      "role": "${targetRole}",
      "matchPercent": 72,
      "strongSkills": ["React", "JavaScript"],
      "missingSkills": ["TypeScript", "Docker", "AWS"]
    },
    {
      "role": "Alternative Role 1",
      "matchPercent": 85,
      "strongSkills": ["skill1"],
      "missingSkills": ["skill2"]
    },
    {
      "role": "Alternative Role 2", 
      "matchPercent": 60,
      "strongSkills": ["skill1"],
      "missingSkills": ["skill2"]
    }
  ],
  "skillsGap": [
    { "skill": "TypeScript", "status": "missing", "priority": 1 },
    { "skill": "Docker", "status": "missing", "priority": 2 },
    { "skill": "React", "status": "have", "priority": 0 }
  ],
  "strengths": ["Strong frontend skills", "Good JavaScript fundamentals", "Hands-on project experience"],
  "weaknesses": ["No cloud experience", "Missing DevOps knowledge"],
  "overallMessage": "You have a solid foundation! Focus on TypeScript and Docker to significantly boost your employability as a ${targetRole}.",
  "weeklyPlan": [
    { "day": 1, "topic": "TypeScript Basics", "duration": "2 hours", "task": "Complete TypeScript handbook chapters 1-3", "resource": "https://www.typescriptlang.org/docs/handbook/intro.html" },
    { "day": 2, "topic": "TypeScript Practice", "duration": "1.5 hours", "task": "Convert one of your JavaScript projects to TypeScript", "resource": "https://www.typescriptlang.org/play" },
    { "day": 3, "topic": "Docker Introduction", "duration": "2 hours", "task": "Install Docker and complete getting-started tutorial", "resource": "https://docs.docker.com/get-started/" },
    { "day": 4, "topic": "Docker Practice", "duration": "1.5 hours", "task": "Dockerize one of your existing projects", "resource": "https://docs.docker.com/language/nodejs/" },
    { "day": 5, "topic": "Review & Practice", "duration": "2 hours", "task": "Build a small project combining TypeScript and Docker", "resource": "" },
    { "day": 6, "topic": "Portfolio Update", "duration": "1 hour", "task": "Add new skills to SkillVault and take skill assessments", "resource": "" },
    { "day": 7, "topic": "Rest & Reflect", "duration": "30 min", "task": "Review what you learned, plan next week", "resource": "" }
  ]
}`;

    const result = await askGemini(prompt, true);

    // Save to MongoDB
    const plan = await LearningPlan.create({
      userId: decoded.id,
      targetRole,
      careerMatch: result.careerMatch || [],
      skillsGap: result.skillsGap || [],
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      overallMessage: result.overallMessage || "",
      weeklyPlan: result.weeklyPlan || [],
    });

    return NextResponse.json({
      message: "AI analysis complete!",
      plan: {
        id: plan._id,
        targetRole,
        careerMatch: result.careerMatch,
        skillsGap: result.skillsGap,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        overallMessage: result.overallMessage,
        weeklyPlan: result.weeklyPlan,
      }
    });

  } catch (err) {
    console.error("Recommend error:", err.message);
    return NextResponse.json({ error: "AI recommendation failed: " + err.message }, { status: 500 });
  }
}

// GET → fetch existing plan
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const plan = await LearningPlan.findOne({ userId: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json({ plan: plan || null });

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}