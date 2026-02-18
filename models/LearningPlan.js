import mongoose from "mongoose";

const LearningPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Goal user selected
  targetRole: { type: String, required: true }, // e.g. "Full Stack Developer"

  // AI Analysis
  careerMatch: [{
    role: String,          // e.g. "Full Stack Developer"
    matchPercent: Number,  // e.g. 78
    missingSkills: [String],
    strongSkills: [String],
  }],

  // Skills gap
  skillsGap: [{
    skill: String,
    status: { type: String, enum: ["have", "partial", "missing"] },
    priority: Number,      // 1=highest priority to learn
  }],

  // Strengths & weaknesses
  strengths: [String],
  weaknesses: [String],
  overallMessage: String,  // AI's personalized message

  // 7-day plan
  weeklyPlan: [{
    day: Number,           // 1-7
    topic: String,
    duration: String,      // e.g. "2 hours"
    task: String,          // what to do
    resource: String,      // suggested resource/link
    completed: { type: Boolean, default: false },
  }],

  // Metadata
  generatedAt: { type: Date, default: Date.now },
  weekNumber: { type: Number, default: 1 },

}, { timestamps: true });

export default mongoose.models.LearningPlan || mongoose.model("LearningPlan", LearningPlanSchema);