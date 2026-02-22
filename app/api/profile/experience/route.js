import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jwtVerify } from "jose";
import User from "@/models/User";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "skillstacktn_super_secret_key_2024"
);

export async function POST(req) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const tokenMatch = cookies.match(/auth-token=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verified = await jwtVerify(token, SECRET);
    const userId = verified.payload.userId;

    const experience = await req.json();

    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { experience } },
      { new: true }
    ).select("-password");

    return NextResponse.json(user);
  } catch (error) {
    console.error("Experience POST error:", error);
    return NextResponse.json({ error: "Failed to add experience" }, { status: 500 });
  }
}