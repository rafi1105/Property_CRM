import { validationResult } from 'express-validator';
import Customer from '../models/Customer.model.js';
import Agent from '../models/Agent.model.js';
import User from '../models/User.model.js';
import {
  notifyHighValueLead,
  notifyCustomerAssigned,
  notifyCustomerAdded,
  notifyCustomerMessage,
  notifyDealClosed
} from '../utils/notificationService.js';

// @desc    Create new customer
// @route   POST /api/customers
// @access  Agent/Admin/Super Admin
export const createCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    console.log('Creating customer with data:', req.body);

    // Clean up empty string fields that should be ObjectId or undefined
    const customerData = { ...req.body, addedBy: req.user._id };
    if (customerData.assignedAgent === '') delete customerData.assignedAgent;
    if (customerData.customerZone === '') delete customerData.customerZone;
    if (customerData.customerThana === '') delete customerData.customerThana;

    const customer = await Customer.create(customerData);

    console.log('Customer created successfully:', customer._id);

    // Notification logic based on role and assignment
    try {
      // If agent adds customer without assignment, notify admins
      if (req.user.role === 'agent' && !customer.assignedAgent) {
        await notifyCustomerAdded(customer, req.user._id);
      }
      
      // If customer has assigned agent
      if (customer.assignedAgent) {
        // Notify agent about assignment
        await notifyCustomerAssigned(customer, customer.assignedAgent);
        
        // High-value lead notification
        if (customer.budget && customer.budget.max && customer.budget.max >= 500000) {
          await notifyHighValueLead(customer, customer.assignedAgent);
        }
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all customers
// @route   GET /api/customers
// @access  Agent/Admin/Super Admin
export const getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query
    const customers = await Customer.find(query)
      .populate('addedBy', 'name email')
      .populate('assignedAgent', 'name email')
      .populate({
        path: 'interestedProperties',
        select: 'name title price location zone thana area',
        options: { strictPopulate: false }
      })
      .populate('notes.addedBy', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    const count = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Agent/Admin/Super Admin
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('addedBy', 'name email')
      .populate('assignedAgent', 'name email phone')
      .populate({
        path: 'interestedProperties',
        select: 'name title price location zone thana area images',
        options: { strictPopulate: false }
      })
      .populate('notes.addedBy', 'name')
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if agent can access this customer
    if (req.user.role === 'agent' && 
        customer.assignedAgent && 
        customer.assignedAgent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this customer'
      });
    }

    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Agent/Admin/Super Admin
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if agent can update this customer
    if (req.user.role === 'agent' && 
        customer.assignedAgent && 
        customer.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this customer'
      });
    }

    // Track if lead status changed to closed/won
    const oldStatus = customer.leadStatus;
    const newStatus = req.body.leadStatus;

    // Clean up empty string fields that should be ObjectId or undefined
    const updateData = { ...req.body };
    if (updateData.assignedAgent === '') delete updateData.assignedAgent;
    if (updateData.customerZone === '') delete updateData.customerZone;
    if (updateData.customerThana === '') delete updateData.customerThana;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedAgent', 'name email');

    // Notify about deal closure
    if (oldStatus !== 'closed_won' && newStatus === 'closed_won') {
      try {
        const dealAmount = req.body.dealAmount || customer.budget || 0;
        await notifyDealClosed(updatedCustomer, customer.assignedAgent, dealAmount);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    // Notify about new customer assignment
    if (req.body.assignedAgent && req.body.assignedAgent !== customer.assignedAgent?.toString()) {
      try {
        await notifyCustomerAssigned(updatedCustomer, req.body.assignedAgent);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Admin/Super Admin
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.deleteOne();

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
};

// @desc    Assign agent to customer
// @route   PATCH /api/customers/:id/assign-agent
// @access  Admin/Super Admin
export const assignAgent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { agentId } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const agent = await Agent.findOne({ userId: agentId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    customer.assignedAgent = agentId;
    await customer.save();

    // Add to agent's assigned customers
    if (!agent.assignedCustomers.includes(customer._id)) {
      agent.assignedCustomers.push(customer._id);
      await agent.save();
    }

    // Notify agent about new customer assignment
    try {
      await notifyCustomerAssigned(customer, agentId);
      
      // Also notify if it's a high-value lead
      if (customer.budget && customer.budget >= 500000) {
        await notifyHighValueLead(customer, agentId);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Agent assigned successfully',
      customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning agent',
      error: error.message
    });
  }
};

// @desc    Add note to customer
// @route   POST /api/customers/:id/notes
// @access  Agent/Admin/Super Admin
export const addNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { note, nextFollowUpDate } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Add note with optional follow-up date
    const noteData = {
      note,
      addedBy: req.user._id
    };
    
    if (nextFollowUpDate) {
      noteData.nextFollowUpDate = new Date(nextFollowUpDate);
      // Also update customer's main nextFollowUpDate if note has one
      customer.nextFollowUpDate = new Date(nextFollowUpDate);
    }

    customer.notes.push(noteData);

    await customer.save();
    
    // Populate the customer to get full details
    await customer.populate([
      { path: 'assignedAgent', select: 'name email' },
      { path: 'addedBy', select: 'name email' },
      { path: 'notes.addedBy', select: 'name' }
    ]);

    // Notify relevant users about the new message
    try {
      const recipientIds = [];
      
      // Notify assigned agent if exists and not the sender
      if (customer.assignedAgent && customer.assignedAgent._id.toString() !== req.user._id.toString()) {
        recipientIds.push(customer.assignedAgent._id);
      }
      
      // Notify all admins and super admins (except sender)
      const admins = await User.find({
        role: { $in: ['admin', 'super_admin'] },
        isActive: true,
        _id: { $ne: req.user._id }
      }).select('_id');
      
      admins.forEach(admin => recipientIds.push(admin._id));
      
      // Send notifications if there are recipients
      if (recipientIds.length > 0) {
        await notifyCustomerMessage(customer, note, req.user.name, recipientIds);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Note added successfully',
      customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
};

// @desc    Get my assigned customers
// @route   GET /api/customers/my/customers
// @access  Agent/Admin/Super Admin
export const getMyCustomers = async (req, res) => {
  try {
    let customers;

    if (req.user.role === 'agent') {
      // Agent sees only assigned customers or customers they added
      customers = await Customer.find({
        $or: [
          { assignedAgent: req.user._id },
          { addedBy: req.user._id }
        ]
      })
        .populate('addedBy', 'name email')
        .populate('assignedAgent', 'name email')
        .populate('interestedProperties', 'name price location')
        .populate('notes.addedBy', 'name')
        .sort('-createdAt');
    } else {
      // Admin/Super Admin see all customers
      customers = await Customer.find()
        .populate('addedBy', 'name email')
        .populate('assignedAgent', 'name email')
        .populate('interestedProperties', 'name price location')
        .populate('notes.addedBy', 'name')
        .sort('-createdAt');
    }

    res.json({
      success: true,
      customers,
      count: customers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// @desc    Get due follow-ups count
// @route   GET /api/customers/follow-ups/due/count
// @access  Agent/Admin/Super Admin
export const getDueFollowUpsCount = async (req, res) => {
  try {
    const query = { isFollowUpDue: true };
    
    // Agent sees only their customers
    if (req.user.role === 'agent') {
      query.$or = [
        { assignedAgent: req.user._id },
        { addedBy: req.user._id }
      ];
    }

    const count = await Customer.countDocuments(query);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting due follow-ups count',
      error: error.message
    });
  }
};

// @desc    Get customers with due follow-ups
// @route   GET /api/customers/follow-ups/due
// @access  Agent/Admin/Super Admin
export const getDueFollowUps = async (req, res) => {
  try {
    const query = { isFollowUpDue: true };
    
    // Agent sees only their customers
    if (req.user.role === 'agent') {
      query.$or = [
        { assignedAgent: req.user._id },
        { addedBy: req.user._id }
      ];
    }

    const customers = await Customer.find(query)
      .populate('addedBy', 'name email')
      .populate('assignedAgent', 'name email')
      .sort('nextFollowUpDate');

    res.json({
      success: true,
      customers,
      count: customers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching due follow-ups',
      error: error.message
    });
  }
};

// @desc    Move customer to different zone/thana/agent
// @route   PUT /api/customers/:id/move
// @access  Admin/Super Admin/Agent (with restrictions)
export const moveCustomer = async (req, res) => {
  try {
    const { zone, thana, agentId } = req.body;

    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Track the previous agent for movement history
    const previousAgent = customer.assignedAgent;

    const updateData = {};
    if (zone) updateData.customerZone = zone;
    if (thana) updateData.customerThana = thana;
    if (agentId) {
      updateData.assignedAgent = agentId;
      // Track movement history
      if (previousAgent && previousAgent.toString() !== agentId) {
        updateData.movedFrom = {
          agent: previousAgent,
          movedAt: new Date(),
          movedBy: req.user._id
        };
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('addedBy', 'name email')
      .populate('assignedAgent', 'name email');

    // Notify new agent about customer assignment
    if (agentId && previousAgent?.toString() !== agentId) {
      try {
        await notifyCustomerAssigned(updatedCustomer, agentId);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Customer moved successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error moving customer',
      error: error.message
    });
  }
};

// @desc    Agent close customer (mark as closed/rejected by agent)
// @route   PUT /api/customers/:id/agent-close
// @access  Agent/Admin/Super Admin
export const agentCloseCustomer = async (req, res) => {
  try {
    const { reason } = req.body;

    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if agent can close this customer
    if (req.user.role === 'agent') {
      const isOwnCustomer = customer.assignedAgent?.toString() === req.user._id.toString() ||
                            customer.addedBy?.toString() === req.user._id.toString();
      if (!isOwnCustomer) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to close this customer'
        });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        agentClosed: true,
        closedBy: req.user._id,
        closedAt: new Date(),
        closeReason: reason || 'Closed by agent',
        status: 'closed'
      },
      { new: true, runValidators: true }
    )
      .populate('addedBy', 'name email')
      .populate('assignedAgent', 'name email')
      .populate('closedBy', 'name email');

    res.json({
      success: true,
      message: 'Customer closed successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error closing customer',
      error: error.message
    });
  }
};

// @desc    Reopen a closed customer
// @route   PUT /api/customers/:id/reopen
// @access  Admin/Super Admin
export const reopenCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        agentClosed: false,
        closedBy: null,
        closedAt: null,
        closeReason: null,
        status: 'new'
      },
      { new: true, runValidators: true }
    )
      .populate('addedBy', 'name email')
      .populate('assignedAgent', 'name email');

    res.json({
      success: true,
      message: 'Customer reopened successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reopening customer',
      error: error.message
    });
  }
};

// @desc    Get foreign/other agents' customers (for search)
// @route   GET /api/customers/foreign
// @access  Agent/Admin/Super Admin
export const getForeignCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build query to exclude own customers
    const query = {
      assignedAgent: { $ne: req.user._id },
      addedBy: { $ne: req.user._id }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .populate('addedBy', 'name email')
      .populate('assignedAgent', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort('-createdAt')
      .exec();

    const count = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching foreign customers',
      error: error.message
    });
  }
};
