import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true ,unique:true},
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  username: {      // ← ADD THIS FIELD
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  avatar: { type: String },
  headline: { type: String }, 
  bio: { type: String },
  location: { type: String },
  
  // Education
  education: [{
    school: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    isCurrentlyStudying: Boolean,
  }],
  
  // Work Experience
  experience: [{
    company: String,
    position: String,
    employmentType: String, // Full-time, Part-time, Freelance
    startDate: Date,
    endDate: Date,
    isCurrentlyWorking: Boolean,
    description: String,
  }],
  
  // Skills
  skills: [{
    name: String,
    proficiency: String, // Beginner, Intermediate, Advanced, Expert
    endorsements: { type: Number, default: 0 },
    yearsOfExperience: Number,
  }],
  
  // Assessment Data
  credentials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Credential' }],
  assessments: [{
    skill: String,
    score: Number,
    level: String,
    passed: Boolean,
    completedAt: Date,
  }],
  
  // Stats
  xp: { type: Number, default: 0 },
  rank: { type: Number },
  totalAssessmentsTaken: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  
  // AI Chat History
  chatHistory: [{
    userMessage: String,
    aiResponse: String,
    timestamp: { type: Date, default: Date.now },
  }],
  
  // Recommendations
  recommendedSkills: [String],
  lastRecommendationUpdate: Date,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', userSchema);