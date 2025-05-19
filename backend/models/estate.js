import mongoose from 'mongoose';

const EstateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  metrics: {
    totalArea: { type: Number, default: 0 },
    activePlots: { type: Number, default: 0 },
    workerCount: { type: Number, default: 0 },
    equipmentCount: { type: Number, default: 0 }
  },
  plots: [{
    name: String,
    area: Number,
    bushAge: Number,
    lastHarvest: Date,
    health: String,
    createdAt: { type: Date, default: Date.now }
  }],
  resources: {
    workers: [{
      role: {
        type: String,
        required: true,
        enum: [
          'Field Supervisor',
          'Tea Plucker',
          'Machine Operator',
          'Quality Inspector',
          'Maintenance Worker',
          'Processing Worker',
          'Field Worker',
          'Transport Worker',
          'Storage Worker'
        ]
      },
      count: {
        type: Number,
        required: true,
        min: 1
      },
      status: {
        type: String,
        required: true,
        enum: ['Active', 'On Leave', 'Training']
      },
      estateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Estate',
        required: true
      },
      createdAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    equipment: [{
      type: {
        type: String,
        required: true,
        enum: [
          'Plucking Machine',
          'Processing Machine',
          'Transport Vehicle',
          'Storage Equipment',
          'Irrigation System',
          'Fertilizer Spreader',
          'Pruning Machine',
          'Quality Testing Equipment',
          'Safety Equipment'
        ]
      },
      count: {
        type: Number,
        required: true,
        min: 1
      },
      status: {
        type: String,
        required: true,
        enum: ['Operational', 'Maintenance', 'Out of Service']
      },
      estateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Estate',
        required: true
      },
      createdAt: { 
        type: Date, 
        default: Date.now 
      }
    }]
  },
  production: [{
    date: Date,
    quantity: Number,
    quality: String,
    notes: String
  }],
  financial: {
    revenue: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    roi: { type: Number, default: 0 }
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

// Add index on userId for faster queries
EstateSchema.index({ userId: 1 });

// Add compound index on userId and name for uniqueness
EstateSchema.index({ userId: 1, name: 1 }, { unique: true });

// Add validation for equipment count updates
EstateSchema.pre('save', function(next) {
  if (this.isModified('resources.equipment')) {
    // Recalculate total equipment count
    this.metrics.equipmentCount = this.resources.equipment.reduce((total, item) => {
      return total + (Number(item.count) || 0);
    }, 0);
  }
  if (this.isModified('resources.workers')) {
    // Recalculate total worker count
    this.metrics.workerCount = this.resources.workers.reduce((total, item) => {
      return total + (Number(item.count) || 0);
    }, 0);
  }
  this.updatedAt = new Date();
  next();
});

const Estate = mongoose.models.Estate || mongoose.model('Estate', EstateSchema);

export default Estate; 