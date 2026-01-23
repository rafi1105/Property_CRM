import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  visitDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true
  },
  feedback: {
    type: String,
    trim: true
  },
  customerInterest: {
    type: String,
    enum: ['very_interested', 'interested', 'not_interested', 'need_to_decide'],
    default: 'interested'
  },
  nextFollowUp: {
    type: Date
  },
  followUpAction: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
visitSchema.index({ agent: 1, visitDate: 1 });
visitSchema.index({ customer: 1, visitDate: 1 });
visitSchema.index({ status: 1, visitDate: 1 });

const Visit = mongoose.model('Visit', visitSchema);

export default Visit;
