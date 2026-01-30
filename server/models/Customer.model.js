import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  customerZone: {
    type: String,
    trim: true
  },
  customerThana: {
    type: String,
    trim: true
  },
  budget: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    }
  },
  preferredLocation: [{
    type: String
  }],
  propertyType: [{
    type: String,
    enum: ['land', 'building', 'house', 'apartment', 'commercial', 'villa', 'penthouse']
  }],
  // Properties interested in
  interestedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  // Assignment tracking
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Status tracking
  status: {
    type: String,
    enum: ['new', 'interested', 'visit-possible', 'visit-done', 'sellable', 'short-process', 'long-process', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // Communication history
  notes: [{
    note: String,
    nextFollowUpDate: {
      type: Date
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  },
  // Source tracking
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'walk_in', 'call', 'other'],
    default: 'website'
  },
  // Reference tracking - who referred this customer
  referredBy: {
    type: String,
    trim: true
  },
  // Visit tracking
  visits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  }],
  // Next follow-up action
  nextFollowUpAction: {
    type: String,
    trim: true
  },
  // Follow-up status tracking
  isFollowUpDue: {
    type: Boolean,
    default: false
  },
  // Agent Close tracking - customer was closed/rejected by agent
  agentClosed: {
    type: Boolean,
    default: false
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedAt: {
    type: Date
  },
  closeReason: {
    type: String,
    trim: true
  },
  // Track customer movement/transfers
  movedFrom: {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    movedAt: Date,
    movedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Index for search
customerSchema.index({ name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ status: 1, priority: 1 });
customerSchema.index({ assignedAgent: 1 });
customerSchema.index({ isFollowUpDue: 1, nextFollowUpDate: 1 });

// Pre-save hook to update isFollowUpDue based on nextFollowUpDate
customerSchema.pre('save', function(next) {
  if (this.nextFollowUpDate) {
    const now = new Date();
    const followUpDate = new Date(this.nextFollowUpDate);
    this.isFollowUpDue = followUpDate <= now;
  } else {
    this.isFollowUpDue = false;
  }
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
