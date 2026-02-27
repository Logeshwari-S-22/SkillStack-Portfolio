import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Credential from "@/models/Credential";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return null;
  }
}

// GET → fetch all credentials for logged-in user
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const credentials = await Credential.find({ userId: decoded.id }).sort({ createdAt: -1 });

    return NextResponse.json({ credentials });
  } catch (err) {
    console.error("Credentials GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}