import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
    // Note: unique: true automatically creates an index
  },
  // Professional details
  licenseNumber: {
    type: String,
    trim: true
  },
  specialization: [{
    type: String,
    enum: ['residential', 'commercial', 'land', 'luxury', 'rental']
  }],
  experience: {
    type: Number, // years
    default: 0
  },
  bio: {
    type: String,
    trim: true
  },
  // Assignments
  assignedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  assignedCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  // Management
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin or Super Admin
  },
  // Performance metrics
  totalSales: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  closedDeals: {
    type: Number,
    default: 0
  },
  activeDeals: {
    type: Number,
    default: 0
  },
  customerSatisfactionRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  // Availability
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  workingHours: {
    start: String, // e.g., "09:00"
    end: String    // e.g., "18:00"
  },
  // Commission structure
  commissionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Social media & contact
  socialMedia: {
    linkedin: String,
    facebook: String,
    instagram: String,
    twitter: String
  }
}, {
  timestamps: true
});

// Index for queries
// Note: userId already has unique index from schema definition
agentSchema.index({ managedBy: 1 });
agentSchema.index({ availability: 1 });

const Agent = mongoose.model('Agent', agentSchema);

export default Agent;
