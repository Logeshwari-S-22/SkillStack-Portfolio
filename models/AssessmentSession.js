import mongoose from "mongoose";

const assessmentSessionSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    },
    type: {
      type: String,
      required: true,
      enum: ["mcq", "code"],
    },
    // ✅ Store questions SERVER-SIDE only
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: String, // ✅ NEVER sent to frontend
      },
    ],
    // ✅ For code challenges: store test cases
    challenge: {
      title: String,
      description: String,
      examples: String,
      constraints: String,
    },
    testCases: [
      {
        input: { type: String, required: true },  // ✅ FIXED
        expectedOutput: { type: String, required: true },  // ✅ FIXED
      },
    ],
    // ✅ Session expires after 30 minutes
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 60 * 1000),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "assessment_sessions" }
);

// ✅ Auto-delete expired sessions
assessmentSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.models.AssessmentSession ||
  mongoose.model("AssessmentSession", assessmentSessionSchema);