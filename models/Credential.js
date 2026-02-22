import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  credentialId: { type: String, unique: true, required: true },
  skill: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
  score: { type: Number, required: true },
  assessmentType: { type: String, enum: ['mcq', 'code'], required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
  issueDate: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active' },
  verifyUrl: { type: String },
  qrCode: { type: String },
  shareCount: { type: Number, default: 0 },
  sharedWith: [{ platform: String, sharedAt: Date }],
}, { timestamps: true });

credentialSchema.pre('save', function(next) {
  if (!this.credentialId) {
    this.credentialId = `CRED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  if (!this.verifyUrl) {
    this.verifyUrl = `/credentials/verify/${this.credentialId}`;
  }
  next();
});

export default mongoose.models.Credential || mongoose.model('Credential', credentialSchema);