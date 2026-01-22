import { validationResult } from 'express-validator';
import Task from '../models/Task.model.js';
import {
  notifyTaskAssigned,
  notifyUrgentTask,
  notifyTaskCompleted
} from '../utils/notificationService.js';

// @desc    Create new task
// @route   POST /api/tasks
// @access  Agent/Admin/Super Admin
export const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id,
      assignedTo: req.body.assignedTo || req.user._id // Self-assign if no assignee
    });

    await task.populate('createdBy assignedTo', 'name email');

    // Send notifications for important events
    try {
      // Notify assigned user if different from creator
      if (task.assignedTo._id.toString() !== task.createdBy._id.toString()) {
        await notifyTaskAssigned(task, task.assignedTo._id);
      }

      // Notify about urgent tasks
      if (task.priority === 'urgent') {
        await notifyUrgentTask(task);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
      // Don't fail task creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Agent/Admin/Super Admin
export const getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      sort = '-createdAt'
    } = req.query;

    // Build query based on role
    let query = {};

    if (req.user.role === 'agent') {
      // Agents see tasks created by them or assigned to them
      query = {
        $or: [
          { createdBy: req.user._id },
          { assignedTo: req.user._id }
        ]
      };
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    // Execute query
    const tasks = await Task.find(query)
      .populate('createdBy assignedTo', 'name email')
      .populate('relatedProperty', 'name location')
      .populate('relatedCustomer', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Task.countDocuments(query);

    res.json({
      success: true,
      tasks,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Agent/Admin/Super Admin
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy assignedTo', 'name email')
      .populate('relatedProperty', 'name location price')
      .populate('relatedCustomer', 'name email phone')
      .populate('comments.addedBy', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if agent can access this task
    if (req.user.role === 'agent' && 
        task.createdBy._id.toString() !== req.user._id.toString() &&
        task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Agent/Admin/Super Admin
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only super_admin, creator, or assigned user can update task
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssigned = task.assignedTo.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isSuperAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Only assigned user can change status (or super_admin)
    if (req.body.status && !isSuperAdmin && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned user can change task status'
      });
    }

    // Non-admins cannot reassign tasks
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin' && req.body.assignedTo) {
      delete req.body.assignedTo;
    }

    // Track if task is being reassigned
    const oldAssignedTo = task.assignedTo.toString();
    const newAssignedTo = req.body.assignedTo;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy assignedTo', 'name email');

    // Notify if task is reassigned to a different user
    if (newAssignedTo && newAssignedTo !== oldAssignedTo) {
      try {
        await notifyTaskAssigned(updatedTask, newAssignedTo);
        
        // If priority changed to urgent, notify about that too
        if (req.body.priority === 'urgent' && task.priority !== 'urgent') {
          await notifyUrgentTask(updatedTask);
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Agent/Admin/Super Admin
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only creator or super_admin can delete
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isSuperAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Only the task creator can delete this task'
      });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

// @desc    Mark task as complete
// @route   PATCH /api/tasks/:id/complete
// @access  Agent/Admin/Super Admin
export const markTaskComplete = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only assigned user or super_admin can mark task complete
    const isAssigned = task.assignedTo.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isSuperAdmin && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned user can change task status'
      });
    }

    // Toggle completion status
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    task.status = newStatus;
    
    if (newStatus === 'completed') {
      task.completedDate = new Date();
    } else {
      task.completedDate = null;
    }

    await task.save();

    // Notify task creator when task is completed
    if (newStatus === 'completed') {
      try {
        await notifyTaskCompleted(task, task.createdBy);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    res.json({
      success: true,
      message: `Task marked as ${newStatus}`,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
      error: error.message
    });
  }
};

// @desc    Add subtask
// @route   POST /api/tasks/:id/subtasks
// @access  Agent/Admin/Super Admin
export const addSubtask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.subtasks.push({ title });
    await task.save();

    res.json({
      success: true,
      message: 'Subtask added successfully',
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding subtask',
      error: error.message
    });
  }
};

// @desc    Toggle subtask completion
// @route   PATCH /api/tasks/:id/subtasks/:subtaskId/toggle
// @access  Agent/Admin/Super Admin
export const toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;
    await task.save();

    res.json({
      success: true,
      message: 'Subtask updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subtask',
      error: error.message
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Agent/Admin/Super Admin
export const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { text } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      text,
      addedBy: req.user._id
    });

    await task.save();

    res.json({
      success: true,
      message: 'Comment added successfully',
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Get my tasks
// @route   GET /api/tasks/my/tasks
// @access  Agent/Admin/Super Admin
export const getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ]
    };

    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate('createdBy assignedTo', 'name email')
      .populate('relatedProperty', 'name location')
      .populate('relatedCustomer', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};
