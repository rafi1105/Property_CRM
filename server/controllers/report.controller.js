import { validationResult } from 'express-validator';
import Report from '../models/Report.model.js';
import User from '../models/User.model.js';

// @desc    Create/Submit daily report
// @route   POST /api/reports
// @access  Agent/Admin/Super Admin
export const createReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { content, activitiesCompleted, stats, reportDate } = req.body;

    // Use provided date or today
    const dateForReport = reportDate ? new Date(reportDate) : new Date();
    dateForReport.setHours(0, 0, 0, 0);

    // Check if report already exists for this date
    const existingReport = await Report.findOne({
      agent: req.user._id,
      reportDate: {
        $gte: dateForReport,
        $lt: new Date(dateForReport.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingReport) {
      // Update existing report
      existingReport.content = content;
      existingReport.activitiesCompleted = activitiesCompleted || [];
      existingReport.stats = stats || existingReport.stats;
      existingReport.status = 'submitted';
      await existingReport.save();

      return res.json({
        success: true,
        message: 'Report updated successfully',
        report: existingReport
      });
    }

    // Create new report
    const report = await Report.create({
      agent: req.user._id,
      reportDate: dateForReport,
      content,
      activitiesCompleted: activitiesCompleted || [],
      stats: stats || {}
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message
    });
  }
};

// @desc    Get all reports (Super Admin only)
// @route   GET /api/reports
// @access  Super Admin
export const getAllReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      agentId,
      startDate,
      endDate,
      status
    } = req.query;

    // Build query
    const query = {};

    if (agentId) {
      query.agent = agentId;
    }

    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) query.reportDate.$gte = new Date(startDate);
      if (endDate) query.reportDate.$lte = new Date(endDate);
    }

    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('agent', 'name email role assignedZone assignedThana')
      .populate('reviewedBy', 'name')
      .sort('-reportDate -createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// @desc    Get reports by zone (Zonal Agent)
// @route   GET /api/reports/zone
// @access  Zonal Agent/Admin/Super Admin
export const getReportsByZone = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      zone,
      startDate,
      endDate
    } = req.query;

    // Get the zone to filter by
    const filterZone = zone || req.user.assignedZone;

    if (!filterZone) {
      return res.status(400).json({
        success: false,
        message: 'Zone is required'
      });
    }

    // Find all agents in this zone
    const agentsInZone = await User.find({
      assignedZone: filterZone,
      role: 'agent',
      isActive: true
    }).select('_id');

    const agentIds = agentsInZone.map(a => a._id);

    // Build query
    const query = { agent: { $in: agentIds } };

    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) query.reportDate.$gte = new Date(startDate);
      if (endDate) query.reportDate.$lte = new Date(endDate);
    }

    const reports = await Report.find(query)
      .populate('agent', 'name email assignedZone assignedThana')
      .sort('-reportDate -createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
      zone: filterZone
    });
  } catch (error) {
    console.error('Error fetching zone reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching zone reports',
      error: error.message
    });
  }
};

// @desc    Get my reports (Agent)
// @route   GET /api/reports/my
// @access  Agent/Admin/Super Admin
export const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reports = await Report.find({ agent: req.user._id })
      .populate('reviewedBy', 'name')
      .sort('-reportDate')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Report.countDocuments({ agent: req.user._id });

    res.json({
      success: true,
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Error fetching my reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// @desc    Get today's report for current user
// @route   GET /api/reports/today
// @access  Agent/Admin/Super Admin
export const getTodayReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const report = await Report.findOne({
      agent: req.user._id,
      reportDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    res.json({
      success: true,
      report: report || null,
      hasSubmittedToday: !!report
    });
  } catch (error) {
    console.error('Error fetching today report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s report',
      error: error.message
    });
  }
};

// @desc    Get report by ID
// @route   GET /api/reports/:id
// @access  Super Admin/Owner
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('agent', 'name email role assignedZone assignedThana')
      .populate('reviewedBy', 'name');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access
    if (req.user.role !== 'super_admin' && 
        report.agent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this report'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

// @desc    Review/Acknowledge report (Super Admin)
// @route   PATCH /api/reports/:id/review
// @access  Super Admin
export const reviewReport = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status || 'reviewed';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    if (reviewNotes) report.reviewNotes = reviewNotes;

    await report.save();

    await report.populate([
      { path: 'agent', select: 'name email' },
      { path: 'reviewedBy', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Report reviewed successfully',
      report
    });
  } catch (error) {
    console.error('Error reviewing report:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing report',
      error: error.message
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Super Admin
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};

// @desc    Get report statistics
// @route   GET /api/reports/stats
// @access  Super Admin
export const getReportStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total agents
    const totalAgents = await User.countDocuments({ 
      role: 'agent', 
      isActive: true 
    });

    // Get reports submitted today
    const todayReports = await Report.countDocuments({
      reportDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get pending reviews
    const pendingReviews = await Report.countDocuments({
      status: 'submitted'
    });

    res.json({
      success: true,
      stats: {
        totalAgents,
        reportsSubmittedToday: todayReports,
        pendingSubmissions: totalAgents - todayReports,
        pendingReviews
      }
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report statistics',
      error: error.message
    });
  }
};
