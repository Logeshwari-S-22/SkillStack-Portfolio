import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Credential from "@/models/Credential";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.NEXTAUTH_SECRET); }
  catch { return null; }
}

// GET → fetch credentials (by user OR by credentialId for verification)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const credId = searchParams.get("id");

    await connectDB();

    // Public verification by credential ID
    if (credId) {
      const credential = await Credential.findOne({ credentialId: credId });
      if (!credential) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ credential });
    }

    // Get own credentials
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const credentials = await Credential.find({ userId: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json({ credentials });

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}