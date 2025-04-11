import mongoose from 'mongoose';

const factorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  factoryName: {
    type: String,
    required: true
  },
  mfNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Factory = mongoose.model('Factory', factorySchema);

export default Factory; 