import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["message", "system", "request"],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    sourceId: {
      type: String,
      default: null
    },
    sourceName: {
      type: String,
      default: null
    },
    sourceType: {
      type: String,
      enum: ["farmer", "factory", "system"],
      default: "system"
    },
    read: {
      type: Boolean,
      default: false
    },
    link: {
      type: String,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Create indexes for faster queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.notification || mongoose.model("notification", notificationSchema);
