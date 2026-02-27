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
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      projects: user.projects || [], 
      xp: user.xp || 0 
    });
  } catch (err) {
    console.error("❌ GET /api/projects error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST → add project + auto-create post
export async function POST(req) {
  try {
    console.log("=== POST /api/projects ===");
    
    // FIRST: Define decoded
    const decoded = getUserFromToken(req);
    console.log("User ID:", decoded?.id);
    
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // SECOND: Define title, description
    const { title, description, techStack, githubUrl, demoUrl, source } = await req.json();
    console.log("Request data:", { title, description, source, githubUrl });

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    // THIRD: Define user
    await connectDB();
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.error("❌ User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log("✅ User found:", user.name);
    // ← INITIALIZE PROJECTS ARRAY RIGHT HERE!
    if (!Array.isArray(user.projects)) {
      console.log("⚠️ Projects is not array, initializing...");
      user.projects = [];
    }

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


    console.log("Projects count before:", user.projects.length);

    // Add project
    user.projects.push({
      title,
      description,
      techStack: techArray,
      githubUrl: githubUrl || "",
      demoUrl: demoUrl || "",
      source: source || "manual",
    });
    user.xp += 20;
    
    console.log("✅ Saving user...");
    await user.save();
    console.log("✅ User saved successfully");

    if (source === "github") {
      try {
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
        console.log("✅ GitHub post created");
      } catch (postErr) {
        console.error("⚠️ Failed to create post:", postErr.message);
      }
    }

    console.log("✅ Project added successfully");

    return NextResponse.json(
      { message: "Project added!", projects: user.projects, xp: user.xp },
      { status: 201 }
    );
    
  } catch (err) {
    console.error("❌ POST /api/projects error:", err.message);
    console.error("Stack:", err.stack);
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await req.json();
    await connectDB();

    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.error("❌ User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!Array.isArray(user.projects)) {
      user.projects = [];
    }

    user.projects = user.projects.filter(p => p._id.toString() !== projectId);
    user.xp = Math.max(0, user.xp - 20);
    await user.save();

    return NextResponse.json({ message: "Project removed", projects: user.projects });
  } catch (err) {
    console.error("❌ DELETE /api/projects error:", err.message);
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}