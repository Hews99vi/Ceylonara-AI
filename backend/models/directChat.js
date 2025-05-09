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
      },
      messagingDisabled: {
        type: Boolean,
        default: false
      },
      lastSeen: {
        type: Date,
        default: null
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
      messageType: {
        type: String,
        enum: ["text", "image", "file"],
        default: "text"
      },
      fileUrl: {
        type: String,
        default: null
      },
      fileName: {
        type: String,
        default: null
      },
      fileSize: {
        type: Number,
        default: null
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      read: {
        type: Boolean,
        default: false
      },
      readAt: {
        type: Date,
        default: null
      }
    }],
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    lastMessagePreview: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.models.directChat || mongoose.model("directChat", directChatSchema);
