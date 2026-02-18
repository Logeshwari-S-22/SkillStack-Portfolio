import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Helper: get user from token
function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return null;
  }
}

// GET → fetch all skills for logged-in user
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.id).select("skills xp");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ skills: user.skills, xp: user.xp });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST → add a new skill
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, level} = await req.json();
    if (!name || !level) return NextResponse.json({ error: "Name and level are required" }, { status: 400 });

    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check duplicate skill
    const exists = user.skills.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) return NextResponse.json({ error: "Skill already added" }, { status: 400 });

    // Add skill and give XP
    user.skills.push({ name, level });
    user.xp += 10; // 10 XP per skill added
    await user.save();

    return NextResponse.json({ message: "Skill added!", skills: user.skills, xp: user.xp }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE → remove a skill
export async function DELETE(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { skillId } = await req.json();
    await connectDB();

    const user = await User.findById(decoded.id);
    user.skills = user.skills.filter(s => s._id.toString() !== skillId);
    user.xp = Math.max(0, user.xp - 10);
    await user.save();

    return NextResponse.json({ message: "Skill removed", skills: user.skills, xp: user.xp });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}