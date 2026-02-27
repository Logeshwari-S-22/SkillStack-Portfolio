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

// GET → fetch all certifications for logged-in user
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.id).select("certifications");
    
    return NextResponse.json({ certifications: user.certifications || [] });
  } catch (err) {
    console.error("Certifications GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST → add a new certification
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, issuer, issueDate, credentialId, credentialUrl } = await req.json();

    if (!title || !issuer) {
      return NextResponse.json({ error: "Title and issuer are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    // Add certification
    user.certifications = user.certifications || [];
    user.certifications.push({
      title,
      issuer,
      issueDate,
      credentialId: credentialId || "",
      credentialUrl: credentialUrl || "",
    });
    user.xp += 30; // 30 XP per certification
    await user.save();

    return NextResponse.json({ certifications: user.certifications, xp: user.xp }, { status: 201 });
  } catch (err) {
    console.error("Certifications POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE → remove a certification
export async function DELETE(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { certId } = await req.json();

    await connectDB();
    const user = await User.findById(decoded.id);
    
    user.certifications = user.certifications.filter(c => c._id.toString() !== certId);
    user.xp = Math.max(0, user.xp - 30);
    await user.save();

    return NextResponse.json({ certifications: user.certifications, xp: user.xp });
  } catch (err) {
    console.error("Certifications DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}