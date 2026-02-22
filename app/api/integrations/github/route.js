import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Integration from "@/models/Integration";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "your-secret-key"
);

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const LANGUAGE_SKILL_MAP = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  php: "PHP",
  ruby: "Ruby",
  swift: "Swift",
  kotlin: "Kotlin",
  react: "React",
  vue: "Vue",
  angular: "Angular",
  "node.js": "Node.js",
  django: "Django",
  flask: "Flask",
  spring: "Spring",
  dotnet: ".NET",
};

export async function POST(req) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verified = await jwtVerify(token, SECRET);
    const userId = verified.payload.userId;

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // Exchange code for token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 400 }
      );
    }

    // Fetch user repos
    const reposRes = await fetch("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const repos = await reposRes.json();

    // Detect languages/skills
    const detectedLanguages = new Set();
    for (const repo of repos.slice(0, 10)) {
      if (repo.language) {
        const skill = LANGUAGE_SKILL_MAP[repo.language.toLowerCase()];
        if (skill) detectedLanguages.add(skill);
      }
    }

    // Get user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const gitHubUser = await userRes.json();

    await connectDB();

    // Create or update integration
    await Integration.findOneAndUpdate(
      { userId, platform: "github" },
      {
        userId,
        platform: "github",
        accessToken,
        externalId: gitHubUser.id,
        detectedSkills: Array.from(detectedLanguages).map((skill) => ({
          name: skill,
          confidence: 80,
          source: "github-detected",
        })),
        stats: {
          repositoryCount: repos.length,
        },
        lastSyncedAt: new Date(),
      },
      { upsert: true }
    );

    // Update user skills
    const user = await User.findById(userId);
    const existingSkillNames = (user.skills || []).map((s) => s.name);
    const newSkills = Array.from(detectedLanguages)
      .filter((skill) => !existingSkillNames.includes(skill))
      .map((skill) => ({ name: skill, proficiency: "Intermediate", endorsements: 0 }));

    user.skills = [...(user.skills || []), ...newSkills];
    await user.save();

    return NextResponse.json({
      success: true,
      detectedSkills: Array.from(detectedLanguages),
      message: "GitHub connected successfully",
    });
  } catch (error) {
    console.error("GitHub integration error:", error);
    return NextResponse.json(
      { error: "Failed to integrate with GitHub" },
      { status: 500 }
    );
  }
}
