import mongoose from "mongoose";

// Schema for storing the average tea price set by the admin
// This will be used as the minimum acceptable price for factories
const averagePriceSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true,
    min: 0
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  setBy: {
    type: String, // Admin user ID
    required: true
  },
  setAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ""
  }
});

// Create a compound index on month and year for efficient querying
averagePriceSchema.index({ month: 1, year: 1 }, { unique: true });

const AveragePrice = mongoose.model('AveragePrice', averagePriceSchema);

export default AveragePrice; 