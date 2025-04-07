import mongoose from "mongoose";

const harvestDataSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    estateName: {
      type: String,
      required: true,
    },
    elevation: {
      type: Number,
      required: true,
    },
    teaType: {
      type: String,
      enum: ["Black", "Green", "White", "Oolong"],
      required: true,
    },
    records: [
      {
        date: {
          type: Date,
          required: true,
        },
        yield: {
          type: Number, // in kg
          required: true,
        },
        rainfall: {
          type: Number, // in mm
          required: false,
        },
        temperature: {
          type: Number, // in Celsius
          required: false,
        },
        humidity: {
          type: Number, // percentage
          required: false,
        },
        notes: {
          type: String,
          required: false,
        }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.models.harvestData || 
  mongoose.model("harvestData", harvestDataSchema);