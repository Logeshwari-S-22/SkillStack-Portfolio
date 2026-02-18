import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Follow from "@/models/Follow";
import User from "@/models/User";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch { return null; }
}

// GET → get followers/following count for a user
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await connectDB();

    const followers = await Follow.countDocuments({ followingId: userId });
    const following = await Follow.countDocuments({ followerId: userId });

    // Check if current user follows this profile
    const decoded = getUserFromToken(req);
    let isFollowing = false;
    if (decoded) {
      const exists = await Follow.findOne({
        followerId: decoded.id,
        followingId: userId,
      });
      isFollowing = !!exists;
    }

    return NextResponse.json({ followers, following, isFollowing });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST → follow or unfollow a user (toggle)
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId } = await req.json();

    if (decoded.id === targetUserId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    await connectDB();

    // Find target user
    const targetUser = await User.findById(targetUserId).select("name username");
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if already following
    const existing = await Follow.findOne({
      followerId: decoded.id,
      followingId: targetUserId,
    });

    if (existing) {
      // Unfollow
      await Follow.findByIdAndDelete(existing._id);
      return NextResponse.json({ message: "Unfollowed", isFollowing: false });
    } else {
      // Follow
      await Follow.create({
        followerId: decoded.id,
        followerName: decoded.name,
        followerUsername: decoded.username,
        followingId: targetUserId,
        followingName: targetUser.name,
        followingUsername: targetUser.username,
      });
      return NextResponse.json({ message: "Following!", isFollowing: true });
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}