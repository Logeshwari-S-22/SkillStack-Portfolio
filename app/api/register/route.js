import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    // Step 1: Get form data from request
    const body = await req.json();
    const { name, email, password, username } = body;

    // Step 2: Check all fields are filled
    if (!name || !email || !password || !username) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Step 3: Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Step 4: Connect to MongoDB
    await connectDB();

    // Step 5: Check if email already registered
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Step 6: Check if username already taken
    const existingUsername = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken. Try another." },
        { status: 400 }
      );
    }

    // Step 7: Hash the password (never store plain text!)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Step 8: Save new user to MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      username: username.toLowerCase().trim(),
    });

    // Step 9: Return success (never send password back!)
    return NextResponse.json(
      {
        message: "Account created successfully!",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          username: newUser.username,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error.message);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}