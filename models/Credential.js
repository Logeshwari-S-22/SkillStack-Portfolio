import mongoose from "mongoose";
import crypto from "crypto";

const CredentialSchema = new mongoose.Schema({
  // Owner
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userUsername: { type: String, required: true },

  // Credential details
  skill: { type: String, required: true },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    required: true,
  },
  score: { type: Number, required: true },  // test score 0-100

  // Verification
  credentialId: {
    type: String,
    unique: true,
    default: () => crypto.randomUUID(),
  },
  verifyUrl: { type: String },

  // Assessment reference
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },

  // Validity
  issuedAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  },
  isValid: { type: Boolean, default: true },

  // Anti-cheat clean flag
  isClean: { type: Boolean, default: true },

}, { timestamps: true });

// Auto-set verifyUrl before saving
CredentialSchema.pre("save", function(next) {
  if (!this.verifyUrl) {
    this.verifyUrl = `/verify/${this.credentialId}`;
  }
  next();
});

export default mongoose.models.Credential || mongoose.model("Credential", CredentialSchema);