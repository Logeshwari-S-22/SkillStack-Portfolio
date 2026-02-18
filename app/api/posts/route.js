import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return null;
  }
}

// GET → fetch current user's own posts
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const posts = await Post.find({ userId: decoded.id })
      .sort({ createdAt: -1 }); // newest first

    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST → create a new post
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, type, link, tags } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await connectDB();

    const post = await Post.create({
      userId: decoded.id,
      userName: decoded.name,
      userUsername: decoded.username,
      title,
      description: description || "",
      type: type || "manual",
      link: link || "",
      tags: tags || [],
    });

    return NextResponse.json(
      { message: "Post created!", post },
      { status: 201 }
    );
  } catch (err) {
    console.error("Post error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE → delete a post
export async function DELETE(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { postId } = await req.json();
    await connectDB();

    // Only owner can delete their post
    await Post.findOneAndDelete({ _id: postId, userId: decoded.id });

    return NextResponse.json({ message: "Post deleted" });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}