import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";

// GET → fetch all posts from all users (public feed)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // filter by type (optional)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20; // posts per page
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (type && type !== "all") filter.type = type;

    // Fetch posts — newest first
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    return NextResponse.json({
      posts,
      total,
      page,
      hasMore: skip + posts.length < total,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}