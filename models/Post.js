import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    // Who created this post
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    userUsername: { type: String, required: true },
    userAvatar: { type: String, default: "" },

    // Post content
    type: {
      type: String,
      enum: ["manual", "github", "hackerrank", "certification"],
      default: "manual",
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    link: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    tags: [{ type: String }],

    // Shares — array of userIds who shared this post
    shares: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        userUsername: String,
        sharedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // createdAt + updatedAt auto added
  }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);