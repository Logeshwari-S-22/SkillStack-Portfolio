import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 300,
    },
    avatar: {
      type: String,
      default: "",
    },
    github: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    // XP points for leaderboard
    xp: {
      type: Number,
      default: 0,
    },
    // Skills array (embedded)
    skills: [
      {
    name: String,
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    },
    source: {
      type: String,
      enum: ["manual", "ai-detected", "project-detected", "certificate-detected", "hackerrank"],
      default: "manual",
    },
    verified: { type: Boolean, default: false }, // true after passing assessment
    addedAt: { type: Date, default: Date.now },
  },
    ],
    // Projects array (embedded)
    projects: [
      {
        title: String,
        description: String,
        techStack: [String],
        githubUrl: String,
        demoUrl: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    // Certifications
    certifications: [
      {
        title: String,
        issuer: String,
        issueDate: Date,
        credentialUrl: String,
        credentialId: String,
      },
    ],
    // Badges earned
    badges: [
      {
        name: String,
        description: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    // Portfolio visibility
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
  }
);

// Prevent model re-compilation in development
export default mongoose.models.User || mongoose.model("User", UserSchema);