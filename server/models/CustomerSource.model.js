import mongoose from 'mongoose';

const customerSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Source name is required'],
    unique: true,
    trim: true
  },
  value: {
    type: String,
    required: [true, 'Source value is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
customerSourceSchema.index({ isActive: 1 });
customerSourceSchema.index({ value: 1 });

const CustomerSource = mongoose.model('CustomerSource', customerSourceSchema);

export default CustomerSource;
