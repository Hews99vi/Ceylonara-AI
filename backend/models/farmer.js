import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  farmerName: {
    type: String,
    required: true
  },
  nicNumber: {
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

const Farmer = mongoose.model('Farmer', farmerSchema);

export default Farmer; 