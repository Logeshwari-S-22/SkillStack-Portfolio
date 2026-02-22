import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";  // ← CHANGE THIS LINE
import User from "@/models/User";
import Credential from "@/models/Credential";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const skillFilter = searchParams.get("skill");

    await connectDB();

    let users = await User.find({}).select("name email xp skills credentials");

    let leaderboard = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let skillCount = user.skills ? user.skills.length : 0;
      let credentialCount = user.credentials ? user.credentials.length : 0;

      if (skillFilter && skillFilter !== "All") {
        const hasSkill = user.skills?.some((s) => s.name === skillFilter);
        if (!hasSkill) continue;
      }

      leaderboard.push({
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp || 0,
        skillCount,
        credentialCount,
        rank: leaderboard.length + 1,
      });
    }

    leaderboard.sort((a, b) => b.xp - a.xp);
    leaderboard = leaderboard.map((u, idx) => ({ ...u, rank: idx + 1 }));

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, 100),
      total: leaderboard.length,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}