import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Credential from "@/models/Credential";

export async function GET(req, { params }) {
  try {
    const username = params.username;

    await connectDB();
    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user's credentials
    const credentials = await Credential.find({ userId: user._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        headline: user.headline,
        bio: user.bio,
        location: user.location,
        username: user.username,
      },
      credentials: credentials,
      skills: user.skills || [],
      projects: user.projects || [],
      certifications: user.certifications || [],
    });
  } catch (error) {
    console.error("Public profile error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}