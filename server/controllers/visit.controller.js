import Visit from '../models/Visit.model.js';
import Customer from '../models/Customer.model.js';

// @desc    Create a new visit record
// @route   POST /api/visits
// @access  Agent/Admin/Super Admin
export const createVisit = async (req, res) => {
  try {
    const { customerId, propertyId, visitDate, status, notes, feedback, customerInterest, nextFollowUp, followUpAction } = req.body;

    // Validate required fields
    if (!customerId || !visitDate) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID and visit date are required'
      });
    }

    // Create visit record
    const visit = await Visit.create({
      customer: customerId,
      property: propertyId || null,
      agent: req.user._id,
      visitDate,
      status: status || 'completed',
      notes,
      feedback,
      customerInterest,
      nextFollowUp,
      followUpAction
    });

    // Add visit to customer's visits array
    await Customer.findByIdAndUpdate(
      customerId,
      {
        $push: { visits: visit._id },
        ...(status === 'completed' && { status: 'visit-done' }),
        ...(nextFollowUp && { nextFollowUpDate: nextFollowUp }),
        ...(followUpAction && { nextFollowUpAction: followUpAction })
      },
      { new: true }
    );

    // Populate visit details before sending response
    const populatedVisit = await Visit.findById(visit._id)
      .populate('customer', 'name phone email')
      .populate('agent', 'name email')
      .populate('property', 'name price location');

    res.status(201).json({
      success: true,
      message: 'Visit recorded successfully',
      visit: populatedVisit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating visit record',
      error: error.message
    });
  }
};

// @desc    Get all visits
// @route   GET /api/visits
// @access  Agent/Admin/Super Admin
export const getAllVisits = async (req, res) => {
  try {
    const { page = 1, limit = 10, customerId, agentId, status } = req.query;

    const query = {};
    if (customerId) query.customer = customerId;
    if (agentId) query.agent = agentId;
    if (status) query.status = status;

    const visits = await Visit.find(query)
      .populate('customer', 'name phone email')
      .populate('agent', 'name email')
      .populate('property', 'name price location')
      .sort({ visitDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Visit.countDocuments(query);

    res.json({
      success: true,
      visits,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visits',
      error: error.message
    });
  }
};

// @desc    Get visit by ID
// @route   GET /api/visits/:id
// @access  Agent/Admin/Super Admin
export const getVisitById = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('agent', 'name email')
      .populate('property', 'name price location');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    res.json({
      success: true,
      visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visit',
      error: error.message
    });
  }
};

// @desc    Update visit
// @route   PUT /api/visits/:id
// @access  Agent/Admin/Super Admin
export const updateVisit = async (req, res) => {
  try {
    const { status, notes, feedback, customerInterest, nextFollowUp, followUpAction } = req.body;

    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        feedback,
        customerInterest,
        nextFollowUp,
        followUpAction
      },
      { new: true, runValidators: true }
    )
      .populate('customer', 'name phone email')
      .populate('agent', 'name email')
      .populate('property', 'name price location');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Update customer's follow-up info if provided
    if (nextFollowUp || followUpAction) {
      await Customer.findByIdAndUpdate(
        visit.customer._id,
        {
          ...(nextFollowUp && { nextFollowUpDate: nextFollowUp }),
          ...(followUpAction && { nextFollowUpAction: followUpAction })
        }
      );
    }

    res.json({
      success: true,
      message: 'Visit updated successfully',
      visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating visit',
      error: error.message
    });
  }
};

// @desc    Delete visit
// @route   DELETE /api/visits/:id
// @access  Agent/Admin/Super Admin
export const deleteVisit = async (req, res) => {
  try {
    const visit = await Visit.findByIdAndDelete(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Remove visit from customer's visits array
    await Customer.findByIdAndUpdate(
      visit.customer,
      { $pull: { visits: visit._id } }
    );

    res.json({
      success: true,
      message: 'Visit deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting visit',
      error: error.message
    });
  }
};

// @desc    Get today's visits for an agent
// @route   GET /api/visits/stats/today
// @access  Agent/Admin/Super Admin
export const getTodaysVisits = async (req, res) => {
  try {
    const { agentId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      visitDate: { $gte: today, $lt: tomorrow },
      status: 'completed'
    };

    if (agentId) {
      query.agent = agentId;
    }

    const visits = await Visit.find(query)
      .populate('customer', 'name phone email')
      .populate('agent', 'name email')
      .populate('property', 'name price location');

    res.json({
      success: true,
      visits,
      count: visits.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s visits',
      error: error.message
    });
  }
};

// @desc    Get monthly visits for an agent
// @route   GET /api/visits/stats/monthly
// @access  Agent/Admin/Super Admin
export const getMonthlyVisits = async (req, res) => {
  try {
    const { agentId } = req.query;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const query = {
      visitDate: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
      status: 'completed'
    };

    if (agentId) {
      query.agent = agentId;
    }

    const visits = await Visit.find(query)
      .populate('customer', 'name phone email')
      .populate('agent', 'name email')
      .populate('property', 'name price location');

    res.json({
      success: true,
      visits,
      count: visits.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly visits',
      error: error.message
    });
  }
};

// @desc    Get total visits for an agent
// @route   GET /api/visits/stats/total
// @access  Agent/Admin/Super Admin
export const getTotalVisits = async (req, res) => {
  try {
    const { agentId } = req.query;

    const query = { status: 'completed' };
    if (agentId) {
      query.agent = agentId;
    }

    const count = await Visit.countDocuments(query);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching total visits',
      error: error.message
    });
  }
};
