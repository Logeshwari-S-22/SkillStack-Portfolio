import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skill: { type: String, required: true },
  type: { type: String, enum: ["mcq", "code"], required: true },
  difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Expert"] },

  // Questions and answers
  questions: [{
    question: String,
    options: [String],       // for MCQ
    correctAnswer: String,   // for MCQ
    userAnswer: String,      // what user selected/wrote
    isCorrect: Boolean,
    points: Number,
  }],

  // Code challenge specific
  codeChallenge: {
    problem: String,         // problem statement
    userCode: String,        // what user wrote
    testCases: [{
      input: String,
      expectedOutput: String,
      passed: Boolean,
    }],
    aiFeedback: String,      // AI evaluation of their code
  },

  // Results
  score: { type: Number, default: 0 },        // 0-100
  passed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 },    // seconds

  // Anti-cheat flags
  antiCheat: {
    pasteCount: { type: Number, default: 0 },
    tabSwitches: { type: Number, default: 0 },
    suspicious: { type: Boolean, default: false },
    flags: [String],
  },

  // Credential issued after passing
  credentialIssued: { type: Boolean, default: false },
  credentialId: { type: String },

}, { timestamps: true });

export default mongoose.models.Assessment || mongoose.model("Assessment", AssessmentSchema);