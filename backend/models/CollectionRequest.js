const collectionRequestSchema = new mongoose.Schema({
  factoryId: {
    type: String,
    required: true
  },
  factoryName: {
    type: String,
    required: true
  },
  farmerId: {
    type: String,
    required: true
  },
  farmerName: {
    type: String,
    required: true
  },
  nicNumber: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  // ... existing code ...
}); 