import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jwtVerify } from "jose";
import User from "@/models/User";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "skillstacktn_super_secret_key_2024"
);

export async function GET(req) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const tokenMatch = cookies.match(/auth-token=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verified = await jwtVerify(token, SECRET);
    const userId = verified.payload.userId;

    await connectDB();
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const tokenMatch = cookies.match(/auth-token=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verified = await jwtVerify(token, SECRET);
    const userId = verified.payload.userId;

    const { name, headline, bio, location } = await req.json();

    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { name, headline, bio, location, updatedAt: new Date() },
      { new: true }
    ).select("-password");

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}