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

export async function POST(req) {
  try {
    console.log("=== POST /api/follow ===");
    
    const decoded = getUserFromToken(req);
    console.log("Decoded:", decoded); // ← Log what we got
    
    if (!decoded) {
      console.error("❌ No token/decoded");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();
    console.log("Target user:", targetUserId);

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
    }

    if (decoded.id === targetUserId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    await connectDB();

    const targetUser = await User.findById(targetUserId);
    console.log("Target user found:", targetUser?.username);
    
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await Follow.findOne({
      followerId: decoded.id,
      followingId: targetUserId,
    });
    console.log("Already following:", !!existing);

    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      console.log("✅ Unfollowed");
      return NextResponse.json({ message: "Unfollowed", isFollowing: false });
    } else {
      // ← ADD SAFETY CHECKS
      const followData = {
        followerId: decoded.id,
        followingId: targetUserId,
      };
      
      // Only add these if they exist
      if (decoded.name) followData.followerName = decoded.name;
      if (decoded.username) followData.followerUsername = decoded.username;
      if (targetUser.name) followData.followingName = targetUser.name;
      if (targetUser.username) followData.followingUsername = targetUser.username;
      
      console.log("Creating follow with:", followData);
      
      const follow = await Follow.create(followData);
      console.log("✅ Following created:", follow._id);
      
      return NextResponse.json({ message: "Following!", isFollowing: true });
    }
  } catch (err) {
    console.error("Follow POST error:", err.message);  // ← LOG ERROR!
    console.error("Stack:", err.stack);                 // ← LOG STACK!
    return NextResponse.json({ 
      error: "Server error: " + err.message  // ← SEND ERROR TO FRONTEND!
    }, { status: 500 });
  }
}