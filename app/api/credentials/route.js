import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jwtVerify } from "jose";
import Credential from "@/models/Credential";

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
    const credentials = await Credential.find({ userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("Credentials GET error:", error);
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}