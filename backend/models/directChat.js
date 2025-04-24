import mongoose from "mongoose";

const directChatSchema = new mongoose.Schema(
  {
    participants: [{
      userId: {
        type: String,
        required: true
      },
      role: {
        type: String,
        enum: ["farmer", "factory"],
        required: true
      },
      name: {
        type: String,
        required: true
      }
    }],
    messages: [{
      sender: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      read: {
        type: Boolean,
        default: false
      }
    }],
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.models.directChat || mongoose.model("directChat", directChatSchema);
