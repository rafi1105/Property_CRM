import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Assignment
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Dates
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  // Related entities
  relatedProperty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  relatedCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  // Task categories
  category: {
    type: String,
    enum: ['follow_up', 'meeting', 'documentation', 'property_showing', 'negotiation', 'other'],
    default: 'other'
  },
  // Subtasks (Google Tasks style)
  subtasks: [{
    title: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  // Comments/Updates
  comments: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reminder
  reminder: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  // Tags
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1, priority: 1 });

// Virtual for overdue check
taskSchema.virtual('isOverdue').get(function() {
  if (this.dueDate && this.status !== 'completed') {
    return new Date() > this.dueDate;
  }
  return false;
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
