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

// GET → fetch all projects
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.id).select("projects xp");
    return NextResponse.json({ projects: user.projects, xp: user.xp });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST → add project + auto-create post
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, techStack, githubUrl, demoUrl, source } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    // Prevent duplicate GitHub projects
    if (githubUrl) {
      const exists = user.projects.find(p => p.githubUrl === githubUrl);
      if (exists) return NextResponse.json({ error: "This project is already in your portfolio" }, { status: 400 });
    }

    // Convert techStack string to array if needed
    const techArray = Array.isArray(techStack)
      ? techStack
      : typeof techStack === "string"
      ? techStack.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    // Save project to user
    user.projects.push({
      title,
      description,
      techStack: techArray,
      githubUrl: githubUrl || "",
      demoUrl: demoUrl || "",
      source: source || "manual",
    });
    user.xp += 20;
    await user.save();

    // Auto-create a post only for GitHub imports
    if (source === "github") {
      await Post.create({
        userId: decoded.id,
        userName: decoded.name,
        userUsername: decoded.username,
        type: "github",
        title: `🐙 Added "${title}" from GitHub!`,
        description: description || "",
        link: githubUrl || demoUrl || "",
        tags: [...techArray.slice(0, 3), "GitHub", "Project"],
      });
    }

    return NextResponse.json(
      { message: "Project added!", projects: user.projects, xp: user.xp },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE → remove a project
export async function DELETE(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await req.json();
    await connectDB();

    const user = await User.findById(decoded.id);
    user.projects = user.projects.filter(p => p._id.toString() !== projectId);
    user.xp = Math.max(0, user.xp - 20);
    await user.save();

    return NextResponse.json({ message: "Project removed", projects: user.projects });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}