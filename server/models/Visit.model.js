import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  visitCode: {
    type: String,
    unique: true,
    sparse: true
  },
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

// Generate unique visit code before saving
visitSchema.pre('save', async function(next) {
  if (!this.visitCode) {
    // Generate visit code: V-YYYYMMDD-XXXX (V-20260218-0001)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Find the last visit created today
    const lastVisit = await this.constructor.findOne({
      visitCode: new RegExp(`^V-${dateStr}-`)
    }).sort({ visitCode: -1 });
    
    let sequence = 1;
    if (lastVisit && lastVisit.visitCode) {
      const lastSequence = parseInt(lastVisit.visitCode.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.visitCode = `V-${dateStr}-${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Index for efficient querying
visitSchema.index({ agent: 1, visitDate: 1 });
visitSchema.index({ customer: 1, visitDate: 1 });
visitSchema.index({ status: 1, visitDate: 1 });
visitSchema.index({ visitCode: 1 });

const Visit = mongoose.model('Visit', visitSchema);

export default Visit;
