import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";  // ← CHANGE THIS
import User from "@/models/User";
import Credential from "@/models/Credential";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "your-secret-key"
);

export async function GET(req) {
  try {
    const token = req.cookies.get("auth-token")?.value;

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

    const credentials = await Credential.find({ userId, status: "active" });
    const skillCount = user.skills ? user.skills.length : 0;
    const credentialCount = credentials.length;

    return NextResponse.json({
      xp: user.xp || 0,
      rank: user.rank || "N/A",
      skillCount,
      credentialCount,
      skills: user.skills || [],
      recentAssessments: credentials.slice(-5).map((c) => ({
        skill: c.skill,
        difficulty: c.difficulty,
        score: c.score,
        passed: c.score >= 40,
        date: c.issueDate,
      })),
    });
  } catch (error) {
    console.error("User stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}