import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch { return null; }
}

// POST → sync all existing certifications and GitHub projects to feed
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.id);

    let created = 0;

    // Sync GitHub projects that have no post yet
    for (const project of user.projects) {
      if (project.source === "github" || project.githubUrl) {
        // Check if post already exists for this project
        const existing = await Post.findOne({
          userId: decoded.id,
          link: project.githubUrl,
          type: "github",
        });
        if (!existing) {
          await Post.create({
            userId: decoded.id,
            userName: decoded.name,
            userUsername: decoded.username,
            type: "github",
            title: `🐙 Added "${project.title}" from GitHub!`,
            description: project.description || "",
            link: project.githubUrl || "",
            tags: [...(project.techStack || []).slice(0, 3), "GitHub", "Project"],
            createdAt: project.startDate || new Date(),
          });
          created++;
        }
      }
    }

    // Sync certifications that have no post yet
    for (const cert of user.certifications) {
      // Skip HackerRank — already handled separately
      if (cert.issuer === "HackerRank") continue;

      const existing = await Post.findOne({
        userId: decoded.id,
        type: "certification",
        title: { $regex: cert.title, $options: "i" },
      });
      if (!existing) {
        await Post.create({
          userId: decoded.id,
          userName: decoded.name,
          userUsername: decoded.username,
          type: "certification",
          title: `🎓 Earned "${cert.title}" Certificate from ${cert.issuer}!`,
          description: `I completed the ${cert.title} certification by ${cert.issuer}.`,
          link: cert.credentialUrl || "",
          tags: [cert.issuer, "Certificate", cert.title],
          createdAt: cert.issueDate || new Date(),
        });
        created++;
      }
    }

    return NextResponse.json({
      message: `Sync complete! Created ${created} new posts.`,
      created,
    });

  } catch (err) {
    console.error("Sync error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}