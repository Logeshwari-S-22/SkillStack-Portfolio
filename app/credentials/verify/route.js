import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Credential from "@/models/Credential";
import User from "@/models/User";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const credentialId = searchParams.get("id");

    if (!credentialId) {
      return NextResponse.json(
        { error: "Credential ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const credential = await Credential.findOne({
      credentialId: credentialId,
      status: "active",
    });

    if (!credential) {
      return NextResponse.json(
        { error: "Credential not found or has been revoked" },
        { status: 404 }
      );
    }

    const user = await User.findById(credential.userId).select(
      "name email headline avatar"
    );

    return NextResponse.json({
      credential: {
        credentialId: credential.credentialId,
        skill: credential.skill,
        level: credential.level,
        score: credential.score,
        assessmentType: credential.assessmentType,
        difficulty: credential.difficulty,
        issueDate: credential.issueDate,
        status: credential.status,
        shareCount: credential.shareCount,
      },
      user: user
        ? {
            name: user.name,
            email: user.email,
            headline: user.headline,
          }
        : null,
    });
  } catch (error) {
    console.error("Verify credential error:", error);
    return NextResponse.json(
      { error: "Failed to verify credential" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { credentialId } = await req.json();

    if (!credentialId) {
      return NextResponse.json(
        { error: "Credential ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const credential = await Credential.findOneAndUpdate(
      { credentialId },
      { $inc: { shareCount: 1 } },
      { new: true }
    );

    if (!credential) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shareCount: credential.shareCount,
    });
  } catch (error) {
    console.error("Share credential error:", error);
    return NextResponse.json(
      { error: "Failed to update share count" },
      { status: 500 }
    );
  }
}
