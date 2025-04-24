import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['farmer', 'factory', 'admin'],
    required: true
  },
  email: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

export default User;
