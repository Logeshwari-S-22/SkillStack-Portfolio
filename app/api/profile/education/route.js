import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return null;
  }
}

// GET → fetch all education
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.id).select("education");

    return NextResponse.json({ education: user.education || [] });
  } catch (err) {
    console.error("Education GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST → add education
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { school, degree, fieldOfStudy, startDate, endDate, isCurrentlyStudying } = await req.json();

    if (!school || !degree) {
      return NextResponse.json({ error: "School and degree are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    // Fix: Use proper MongoDB syntax
    user.education = user.education || [];
    user.education.push({
      school,
      degree,
      fieldOfStudy: fieldOfStudy || "",
      startDate: startDate || "",
      endDate: endDate || "",
      isCurrentlyStudying: isCurrentlyStudying || false,
    });

    await user.save();

    return NextResponse.json({ education: user.education }, { status: 201 });
  } catch (err) {
    console.error("Education POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}