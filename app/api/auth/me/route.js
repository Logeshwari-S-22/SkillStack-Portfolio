import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // Get token from cookie
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not logged in" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

    return NextResponse.json({ user: decoded }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }
}