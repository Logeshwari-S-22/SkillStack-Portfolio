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

// GET → fetch all experience
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.id).select("experience");

    return NextResponse.json({ experience: user.experience || [] });
  } catch (err) {
    console.error("Experience GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST → add experience
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { company, position, employmentType, startDate, endDate, isCurrentlyWorking, description } = await req.json();

    if (!company || !position) {
      return NextResponse.json({ error: "Company and position are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    // Fix: Use proper MongoDB syntax
    user.experience = user.experience || [];
    user.experience.push({
      company,
      position,
      employmentType: employmentType || "Full-time",
      startDate: startDate || "",
      endDate: endDate || "",
      isCurrentlyWorking: isCurrentlyWorking || false,
      description: description || "",
    });

    await user.save();

    return NextResponse.json({ experience: user.experience }, { status: 201 });
  } catch (err) {
    console.error("Experience POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}