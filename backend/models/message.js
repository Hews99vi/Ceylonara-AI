import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    text: {  // Changed from content to text to match your backend code
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.message || mongoose.model("message", messageSchema);