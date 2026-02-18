import mongoose from "mongoose";

const FollowSchema = new mongoose.Schema(
  {
    // The user who clicked "Follow"
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followerName: { type: String, required: true },
    followerUsername: { type: String, required: true },

    // The user being followed
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingName: { type: String, required: true },
    followingUsername: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate follows
// One user can only follow another user once
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.models.Follow || mongoose.model("Follow", FollowSchema);