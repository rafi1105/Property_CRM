import Property from '../models/Property.model.js';
import Customer from '../models/Customer.model.js';
import Task from '../models/Task.model.js';
import Agent from '../models/Agent.model.js';
import User from '../models/User.model.js';
import Visit from '../models/Visit.model.js';

// @desc    Get dashboard stats (role-based)
// @route   GET /api/dashboard/stats
// @access  Agent/Admin/Super Admin
export const getDashboardStats = async (req, res) => {
  try {
    let stats;

    switch (req.user.role) {
      case 'super_admin':
        stats = await getSuperAdminStatsData();
        break;
      case 'admin':
        stats = await getAdminStatsData(req.user._id);
        break;
      case 'agent':
        stats = await getAgentStatsData(req.user._id);
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc    Get Super Admin stats
// @route   GET /api/dashboard/super-admin/stats
// @access  Super Admin
export const getSuperAdminStats = async (req, res) => {
  try {
    const stats = await getSuperAdminStatsData();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching super admin stats',
      error: error.message
    });
  }
};

// @desc    Get Admin stats
// @route   GET /api/dashboard/admin/stats
// @access  Admin
export const getAdminStats = async (req, res) => {
  try {
    const stats = await getAdminStatsData(req.user._id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin stats',
      error: error.message
    });
  }
};

// @desc    Get Agent stats
// @route   GET /api/dashboard/agent/stats
// @access  Agent
export const getAgentStats = async (req, res) => {
  try {
    const stats = await getAgentStatsData(req.user._id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agent stats',
      error: error.message
    });
  }
};

// Helper functions to calculate stats

async function getSuperAdminStatsData() {
  const [
    totalProperties,
    publishedProperties,
    totalCustomers,
    totalTasks,
    totalAgents,
    totalAdmins,
    totalUsers,
    recentProperties,
    recentCustomers,
    tasksByStatus,
    propertiesByType,
    propertiesByStatus,
    customersByStatus,
    monthlyStats,
    totalVisits,
    monthlyVisits
  ] = await Promise.all([
    Property.countDocuments(),
    Property.countDocuments({ publishedToFrontend: true }),
    Customer.countDocuments(),
    Task.countDocuments(),
    User.countDocuments({ role: 'agent' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'user' }),
    Property.find().sort('-createdAt').limit(5).populate('uploadedBy', 'name'),
    Customer.find().sort('-createdAt').limit(5).populate('addedBy', 'name'),
    getTasksByStatus(),
    getPropertiesByType(),
    getPropertiesByStatus(),
    getCustomersByStatus(),
    getMonthlyStats(),
    Visit.countDocuments({ status: 'completed' }),
    getVisitsByMonth()
  ]);

  return {
    overview: {
      totalProperties,
      publishedProperties,
      totalCustomers,
      totalTasks,
      totalAgents,
      totalAdmins,
      totalUsers,
      totalVisits
    },
    visits: {
      totalVisits,
      monthlyVisits
    },
    recentProperties,
    recentCustomers,
    charts: {
      tasksByStatus,
      propertiesByType,
      propertiesByStatus,
      customersByStatus,
      monthlyStats
    }
  };
}

async function getAdminStatsData(adminId) {
  const [
    totalProperties,
    myProperties,
    totalCustomers,
    totalTasks,
    myTasks,
    totalAgents,
    recentProperties,
    recentCustomers,
    tasksByStatus,
    propertiesByType
  ] = await Promise.all([
    Property.countDocuments(),
    Property.countDocuments({ uploadedBy: adminId }),
    Customer.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ createdBy: adminId }),
    User.countDocuments({ role: 'agent' }),
    Property.find().sort('-createdAt').limit(5).populate('uploadedBy', 'name'),
    Customer.find().sort('-createdAt').limit(5).populate('addedBy', 'name'),
    getTasksByStatus(),
    getPropertiesByType()
  ]);

  return {
    overview: {
      totalProperties,
      myProperties,
      totalCustomers,
      totalTasks,
      myTasks,
      totalAgents
    },
    recentProperties,
    recentCustomers,
    charts: {
      tasksByStatus,
      propertiesByType
    }
  };
}

async function getAgentStatsData(agentId) {
  const agent = await Agent.findOne({ userId: agentId })
    .populate('assignedProperties')
    .populate('assignedCustomers');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [
    myTasks,
    completedTasks,
    pendingTasks,
    recentTasks,
    tasksByPriority,
    todaysVisits,
    monthlyVisits,
    totalVisits,
    totalCustomers,
    ownCustomers,
    dueFollowUpsCount
  ] = await Promise.all([
    Task.countDocuments({
      $or: [{ createdBy: agentId }, { assignedTo: agentId }]
    }),
    Task.countDocuments({
      $or: [{ createdBy: agentId }, { assignedTo: agentId }],
      status: 'completed'
    }),
    Task.countDocuments({
      $or: [{ createdBy: agentId }, { assignedTo: agentId }],
      status: { $ne: 'completed' }
    }),
    Task.find({
      $or: [{ createdBy: agentId }, { assignedTo: agentId }]
    }).sort('-createdAt').limit(5).populate('relatedProperty relatedCustomer'),
    getTasksByPriority(agentId),
    Visit.countDocuments({
      agent: agentId,
      status: 'completed',
      visitDate: { $gte: today, $lt: tomorrow }
    }),
    Visit.countDocuments({
      agent: agentId,
      status: 'completed',
      visitDate: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
    }),
    Visit.countDocuments({
      agent: agentId,
      status: 'completed'
    }),
    Customer.countDocuments({
      $or: [
        { assignedAgent: agentId },
        { addedBy: agentId }
      ]
    }),
    Customer.countDocuments({
      assignedAgent: agentId
    }),
    Customer.countDocuments({
      $or: [
        { assignedAgent: agentId },
        { addedBy: agentId }
      ],
      isFollowUpDue: true
    })
  ]);

  return {
    overview: {
      assignedProperties: agent?.assignedProperties?.length || 0,
      assignedCustomers: agent?.assignedCustomers?.length || 0,
      totalCustomers,
      ownCustomers,
      totalTasks: myTasks,
      completedTasks,
      pendingTasks,
      totalSales: agent?.totalSales || 0,
      totalCommission: agent?.totalCommission || 0,
      dueFollowUpsCount
    },
    visits: {
      todaysVisits,
      monthlyVisits,
      totalVisits
    },
    assignedProperties: agent?.assignedProperties || [],
    assignedCustomers: agent?.assignedCustomers || [],
    recentTasks,
    charts: {
      tasksByPriority
    }
  };
}

// Chart data helpers

async function getTasksByStatus() {
  const tasks = await Task.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return tasks.map(t => ({
    name: t._id,
    value: t.count
  }));
}

async function getPropertiesByType() {
  const properties = await Property.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  return properties.map(p => ({
    name: p._id,
    value: p.count
  }));
}

async function getPropertiesByStatus() {
  const properties = await Property.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return properties.map(p => ({
    name: p._id,
    value: p.count
  }));
}

async function getCustomersByStatus() {
  const customers = await Customer.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return customers.map(c => ({
    name: c._id,
    value: c.count
  }));
}

async function getTasksByPriority(agentId) {
  const tasks = await Task.aggregate([
    {
      $match: {
        $or: [{ createdBy: agentId }, { assignedTo: agentId }]
      }
    },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  return tasks.map(t => ({
    name: t._id,
    value: t.count
  }));
}

async function getMonthlyStats() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [properties, customers] = await Promise.all([
    Property.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  // Merge and format monthly data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const propertyData = properties.find(p => p._id.month === month && p._id.year === year);
    const customerData = customers.find(c => c._id.month === month && c._id.year === year);

    monthlyData.push({
      month: months[month - 1],
      properties: propertyData?.count || 0,
      customers: customerData?.count || 0
    });
  }

  return monthlyData;
}
async function getVisitsByMonth() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const visits = await Visit.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$visitDate' },
          month: { $month: '$visitDate' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const visitData = visits.find(v => v._id.month === month && v._id.year === year);

    monthlyData.push({
      month: months[month - 1],
      visits: visitData?.count || 0
    });
  }

  return monthlyData;
}