import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, enum: ['github', 'hackerrank', 'leetcode', 'coursera'], required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  externalId: { type: String },
  detectedSkills: [{
    name: { type: String },
    confidence: { type: Number }, // 0-100%
    source: { type: String } // 'github-detected', 'hackerrank-detected', etc
  }],
  stats: {
    repositoryCount: { type: Number, default: 0 },
    commitCount: { type: Number, default: 0 },
    rating: { type: Number },
    problems_solved: { type: Number, default: 0 }
  },
  lastSyncedAt: { type: Date },
  syncStatus: { type: String, enum: ['synced', 'syncing', 'failed'], default: 'synced' },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export default mongoose.models.Integration || mongoose.model('Integration', integrationSchema);