import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";  
import connectDB from "@/lib/mongodb";
import User from "@/models/User";



function getUserFromToken(req) {  
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch { return null; }
}

export async function GET(req) {
  try {
  
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = decoded.id;  

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
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = decoded.id;  

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