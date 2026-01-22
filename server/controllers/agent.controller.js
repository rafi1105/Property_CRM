import { validationResult } from 'express-validator';
import Agent from '../models/Agent.model.js';
import User from '../models/User.model.js';
import { notifyAgentAdded } from '../utils/notificationService.js';

// @desc    Create new agent
// @route   POST /api/agents
// @access  Admin/Super Admin
export const createAgent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId } = req.body;

    // Check if user exists and is an agent
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'User must have agent role'
      });
    }

    // Check if agent profile already exists
    const existingAgent = await Agent.findOne({ userId });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'Agent profile already exists'
      });
    }

    const agent = await Agent.create({
      ...req.body,
      managedBy: req.user._id
    });

    await agent.populate('userId managedBy', 'name email');

    // Notify super admins about new agent
    try {
      await notifyAgentAdded(agent, userId);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating agent',
      error: error.message
    });
  }
};

// @desc    Get all agents
// @route   GET /api/agents
// @access  Admin/Super Admin
export const getAllAgents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      availability,
      specialization,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};

    if (availability) query.availability = availability;
    if (specialization) query.specialization = specialization;

    // Execute query
    const agents = await Agent.find(query)
      .populate('userId', 'name email phone isActive')
      .populate('managedBy', 'name email')
      .populate('assignedProperties', 'name location')
      .populate('assignedCustomers', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Agent.countDocuments(query);

    res.json({
      success: true,
      agents,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agents',
      error: error.message
    });
  }
};

// @desc    Get agent by ID
// @route   GET /api/agents/:id
// @access  Admin/Super Admin
export const getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id)
      .populate('userId', 'name email phone address photoURL isActive')
      .populate('managedBy', 'name email')
      .populate('assignedProperties', 'name location price state')
      .populate('assignedCustomers', 'name email phone status');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agent',
      error: error.message
    });
  }
};

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Admin/Super Admin
export const updateAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId managedBy', 'name email');

    res.json({
      success: true,
      message: 'Agent updated successfully',
      agent: updatedAgent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating agent',
      error: error.message
    });
  }
};

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Admin/Super Admin
export const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    await agent.deleteOne();

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting agent',
      error: error.message
    });
  }
};

// @desc    Get agent statistics
// @route   GET /api/agents/:id/stats
// @access  Admin/Super Admin
export const getAgentStats = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id)
      .populate('assignedProperties')
      .populate('assignedCustomers');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    const stats = {
      totalProperties: agent.assignedProperties.length,
      totalCustomers: agent.assignedCustomers.length,
      totalSales: agent.totalSales,
      totalCommission: agent.totalCommission,
      closedDeals: agent.closedDeals,
      activeDeals: agent.activeDeals,
      customerSatisfactionRating: agent.customerSatisfactionRating
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agent statistics',
      error: error.message
    });
  }
};
