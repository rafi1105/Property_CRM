import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  content: {
    type: String,
    required: [true, 'Report content is required'],
    trim: true
  },
  // Track tasks/activities done
  activitiesCompleted: [{
    type: String,
    trim: true
  }],
  // Statistics for the day
  stats: {
    customersAdded: {
      type: Number,
      default: 0
    },
    customersCalled: {
      type: Number,
      default: 0
    },
    visitsCompleted: {
      type: Number,
      default: 0
    },
    propertiesShown: {
      type: Number,
      default: 0
    }
  },
  // Status of the report
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'acknowledged'],
    default: 'submitted'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ agent: 1, reportDate: -1 });
reportSchema.index({ reportDate: -1 });

// Prevent duplicate reports for same agent on same date
reportSchema.index({ agent: 1, reportDate: 1 }, { 
  unique: true,
  partialFilterExpression: { 
    reportDate: { $type: 'date' } 
  }
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
