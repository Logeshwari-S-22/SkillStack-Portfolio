import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch { return null; }
}

// POST → share a post
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { postId } = await req.json();
    await connectDB();

    const post = await Post.findById(postId);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // Check if already shared
    const alreadyShared = post.shares.find(
      s => s.userId.toString() === decoded.id
    );
    if (alreadyShared) {
      return NextResponse.json({ error: "Already shared" }, { status: 400 });
    }

    // Can't share your own post
    if (post.userId.toString() === decoded.id) {
      return NextResponse.json({ error: "Cannot share your own post" }, { status: 400 });
    }

    // Add to shares array
    post.shares.push({
      userId: decoded.id,
      userName: decoded.name,
      userUsername: decoded.username,
    });
    await post.save();

    return NextResponse.json({
      message: "Post shared!",
      shares: post.shares.length,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}