import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardAPI, propertyAPI, visitAPI, customerAPI } from '../utils/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  PlusIcon,
  XMarkIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [visits, setVisits] = useState([]);
  const [visitStats, setVisitStats] = useState({ today: 0, monthly: 0, total: 0 });
  const [dueFollowUpsCount, setDueFollowUpsCount] = useState(0);
  const [dueFollowUps, setDueFollowUps] = useState([]);
  const [ownCustomersCount, setOwnCustomersCount] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    phone: '',
    address: ''
  });
  const [visitForm, setVisitForm] = useState({
    customerId: '',
    propertyCode: '',
    visitDate: new Date().toISOString().split('T')[0],
    status: 'completed',
    notes: '',
    feedback: '',
    customerInterest: 'interested',
    nextFollowUp: '',
    followUpAction: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchVisitData();
    fetchFollowUps();
    fetchOwnCustomers();
    fetchCustomers();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      let statsResponse;
      if (user.role === 'super_admin') {
        statsResponse = await dashboardAPI.getSuperAdminStats();
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const usersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      } else if (user.role === 'admin') {
        statsResponse = await dashboardAPI.getAdminStats();
      } else {
        statsResponse = await dashboardAPI.getAgentStats();
      }
      
      setStats(statsResponse.data.stats);
      
      const propertiesResponse = await propertyAPI.getAll();
      setProperties(Array.isArray(propertiesResponse.data) ? propertiesResponse.data : propertiesResponse.data?.properties || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitData = async () => {
    try {
      const agentId = user.role === 'agent' ? user._id : undefined;
      
      // Get visit statistics
      if (stats?.visits) {
        setVisitStats({
          today: stats.visits.todaysVisits || 0,
          monthly: stats.visits.monthlyVisits || 0,
          total: stats.visits.totalVisits || 0
        });
      } else {
        const [todayRes, monthlyRes, totalRes] = await Promise.all([
          visitAPI.getTodaysVisits(agentId),
          visitAPI.getMonthlyVisits(agentId),
          visitAPI.getTotalVisits(agentId)
        ]);
        
        setVisitStats({
          today: todayRes.data.count || 0,
          monthly: monthlyRes.data.count || 0,
          total: totalRes.data.count || 0
        });
      }
      
      // Get recent visits
      const visitsResponse = await visitAPI.getAll({ limit: 10, agentId });
      setVisits(visitsResponse.data.visits || []);
    } catch (error) {
      console.error('Error fetching visit data:', error);
    }
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    try {
      await visitAPI.create(visitForm);
      toast.success('Visit recorded successfully!');
      setShowVisitModal(false);
      resetVisitForm();
      fetchVisitData();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record visit');
    }
  };

  const fetchFollowUps = async () => {
    try {
      const countRes = await customerAPI.getDueFollowUpsCount();
      setDueFollowUpsCount(countRes.data.count || 0);
    } catch (error) {
      console.error('Error fetching follow-ups count:', error);
    }
  };

  const fetchOwnCustomers = async () => {
    try {
      const response = await customerAPI.getMyCustomers();
      const customers = response.data?.customers || response.data || [];
      setOwnCustomersCount(Array.isArray(customers) ? customers.length : 0);
    } catch (error) {
      console.error('Error fetching own customers count:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Use appropriate API based on role
      const response = user?.role === 'agent'
        ? await customerAPI.getMyCustomers()
        : await customerAPI.getAll({ limit: 200 });
      setCustomers(response.data?.customers || response.data || []);
    } catch (error) {
      console.error('Error fetching customers for visit form:', error);
    }
  };

  const loadDueFollowUps = async () => {
    try {
      const response = await customerAPI.getDueFollowUps();
      setDueFollowUps(response.data.customers || []);
      setShowFollowUpModal(true);
    } catch (error) {
      toast.error('Failed to load due follow-ups');
    }
  };

  const resetVisitForm = () => {
    setVisitForm({
      customerId: '',
      propertyCode: '',
      visitDate: new Date().toISOString().split('T')[0],
      status: 'completed',
      notes: '',
      feedback: '',
      customerInterest: 'interested',
      nextFollowUp: '',
      followUpAction: ''
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/auth/create-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('User created successfully!');
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'admin', phone: '', address: '' });
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Error creating user');
    }
  };

  // Chart data - use dynamic data from API or fallback to defaults
  const monthlyData = stats?.charts?.monthlyStats?.length > 0 
    ? stats.charts.monthlyStats.map(item => ({
        name: item.month || item.name,
        properties: item.properties || 0,
        customers: item.customers || 0
      }))
    : [
        { name: 'Jan', properties: 0, customers: 0 },
        { name: 'Feb', properties: 0, customers: 0 },
        { name: 'Mar', properties: 0, customers: 0 },
        { name: 'Apr', properties: 0, customers: 0 },
        { name: 'May', properties: 0, customers: 0 },
        { name: 'Jun', properties: 0, customers: 0 },
      ];

  // Dynamic property type data from API
  const propertyTypeData = stats?.charts?.propertiesByType?.length > 0 
    ? stats.charts.propertiesByType.map((item, index) => ({
        name: item._id || item.name || 'Unknown',
        value: item.count || item.value || 0,
        color: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'][index % 6]
      }))
    : [
        { name: 'Land', value: 0, color: '#8B5CF6' },
        { name: 'Building', value: 0, color: '#EC4899' },
        { name: 'House', value: 0, color: '#F59E0B' },
        { name: 'Apartment', value: 0, color: '#10B981' },
      ];

  // Dynamic recent activities from stats
  const recentActivities = [
    ...(stats?.recentProperties || []).slice(0, 2).map((p, i) => ({
      id: `prop-${i}`,
      type: 'property',
      action: 'Property added',
      item: p.title || p.name || 'New Property',
      time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recently',
      icon: BuildingOfficeIcon,
      color: 'bg-purple-100 text-purple-600'
    })),
    ...(stats?.recentCustomers || []).slice(0, 2).map((c, i) => ({
      id: `cust-${i}`,
      type: 'customer',
      action: 'Customer added',
      item: c.name || 'New Customer',
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently',
      icon: UsersIcon,
      color: 'bg-blue-100 text-blue-600'
    }))
  ].slice(0, 4);

  // Fallback if no activities
  const displayActivities = recentActivities.length > 0 ? recentActivities : [
    { id: 1, type: 'info', action: 'No recent activity', item: 'Start adding properties or customers', time: 'Now', icon: ClockIcon, color: 'bg-gray-100 text-gray-600' },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Welcome back!">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${user?.name}!`}>
      {/* Follow-up Notification Banner */}
      {dueFollowUpsCount > 0 && (
        <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ExclamationCircleIcon className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Follow-up Required
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-white text-red-600 rounded-full text-sm font-bold">
                    {dueFollowUpsCount}
                  </span>
                </h3>
                <p className="text-sm text-white/90">
                  You have {dueFollowUpsCount} customer{dueFollowUpsCount !== 1 ? 's' : ''} that need follow-up
                </p>
              </div>
            </div>
            <button
              onClick={loadDueFollowUps}
              className="px-5 py-2.5 bg-white text-red-600 rounded-xl hover:bg-white/90 transition-all font-medium"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Properties */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <Link
              to="/dashboard/properties"
              className="text-xs font-medium text-purple-600 hover:text-purple-700"
            >
              View →
            </Link>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats?.overview?.totalProperties || stats?.totalProperties || 0}</h3>
          <p className="text-gray-500 text-sm mt-1">Total Properties</p>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <Link
              to="/dashboard/customers"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View →
            </Link>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats?.overview?.totalCustomers || stats?.totalCustomers || 0}</h3>
          <p className="text-gray-500 text-sm mt-1">Total Customers</p>
        </div>

        {/* Own Customers (My Customers) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <Link
              to="/dashboard/customers"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              View →
            </Link>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{ownCustomersCount}</h3>
          <p className="text-gray-500 text-sm mt-1">My Customers</p>
        </div>

        {/* Active Tasks */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600" />
            </div>
            <Link
              to="/dashboard/tasks"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              View →
            </Link>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats?.overview?.totalTasks || stats?.pendingTasks || stats?.activeTasks || 0}</h3>
          <p className="text-gray-500 text-sm mt-1">Active Tasks</p>
        </div>

        {/* Total Agents/Users */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <Link
              to="/dashboard/agents"
              className="text-xs font-medium text-green-600 hover:text-green-700"
            >
              View →
            </Link>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats?.overview?.totalAgents || stats?.totalAgents || stats?.totalUsers || 0}</h3>
          <p className="text-gray-500 text-sm mt-1">{user?.role === 'super_admin' ? 'Total Users' : 'Total Agents'}</p>
        </div>
      </div>

      {/* Visit Done Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Visit Done</h2>
          <button
            onClick={() => setShowVisitModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            Record Visit
          </button>
        </div>

        {/* Visit Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CalendarDaysIcon className="w-8 h-8 opacity-80" />
              <CheckCircleIcon className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold">{visitStats.today}</h3>
            <p className="text-blue-100 text-sm mt-1">Today's Visits</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CalendarDaysIcon className="w-8 h-8 opacity-80" />
              <ClockIcon className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold">{visitStats.monthly}</h3>
            <p className="text-indigo-100 text-sm mt-1">This Month's Visits</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <ChartBarIcon className="w-8 h-8 opacity-80" />
              <ExclamationCircleIcon className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold">{visitStats.total}</h3>
            <p className="text-purple-100 text-sm mt-1">Total Visits</p>
          </div>
        </div>

        {/* Recent Visits List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Visits</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {visits.length > 0 ? (
              visits.slice(0, 5).map((visit) => (
                <div key={visit._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{visit.customer?.name || 'Unknown Customer'}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {visit.property ? `Property: ${visit.property.name}` : 'No property specified'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(visit.visitDate).toLocaleDateString()} - {visit.agent?.name || 'Unknown Agent'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                        visit.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {visit.status}
                      </span>
                      {visit.customerInterest && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          visit.customerInterest === 'very_interested' ? 'bg-purple-100 text-purple-700' :
                          visit.customerInterest === 'interested' ? 'bg-blue-100 text-blue-700' :
                          visit.customerInterest === 'not_interested' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {visit.customerInterest.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-gray-400">
                <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No visits recorded yet</p>
              </div>
            )}
          </div>
          {visits.length > 5 && (
            <div className="px-6 py-3 bg-gray-50 text-center">
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View all visits →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Activity Overview</h3>
              <p className="text-sm text-gray-500">Monthly performance metrics</p>
            </div>
            <select className="px-3 py-2 bg-gray-100 border-0 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-purple-500">
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="h-72" style={{ minHeight: '288px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorProperties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Area type="monotone" dataKey="properties" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorProperties)" />
                <Area type="monotone" dataKey="customers" stroke="#EC4899" strokeWidth={2} fill="url(#colorCustomers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Property Types Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Property Types</h3>
          <div className="h-48" style={{ minHeight: '192px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertyTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {propertyTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {propertyTypeData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Properties */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Properties</h3>
            <Link to="/properties" className="text-purple-600 text-sm font-medium hover:text-purple-700">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {properties.slice(0, 5).map((property) => (
                  <tr key={property._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{property.title}</p>
                          <p className="text-sm text-gray-500">{property.location?.area}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600">{property.type}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">৳{property.price?.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        property.status === 'available' 
                          ? 'bg-green-100 text-green-700'
                          : property.status === 'sold'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => navigate(`/properties`)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500 truncate">{activity.item}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions - Super Admin Only */}
      {user?.role === 'super_admin' && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Add User
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.slice(0, 6).map((u) => (
              <div key={u._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{u.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    u.role === 'super_admin' 
                      ? 'bg-purple-100 text-purple-700'
                      : u.role === 'admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {u.role?.replace('_', ' ')}
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${u.isActive !== false ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${u.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    {u.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Transition appear show={showAddUserModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowAddUserModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">
                      Add New User
                    </Dialog.Title>
                    <button
                      onClick={() => setShowAddUserModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        required
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      >
                        <option value="admin">Admin</option>
                        <option value="agent">Agent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                      Create User
                    </button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Visit Modal */}
      <Transition appear show={showVisitModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowVisitModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">Record Visit</Dialog.Title>
                    <button onClick={() => setShowVisitModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddVisit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                        <select
                          required
                          value={visitForm.customerId}
                          onChange={(e) => setVisitForm({...visitForm, customerId: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        >
                          <option value="">Select Customer</option>
                          {customers
                            .filter(customer => customer.assignedAgent)
                            .map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.name} - {customer.phone} (Agent: {customer.assignedAgent?.name || 'Unknown'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Property Code (Optional)</label>
                        <input
                          type="text"
                          value={visitForm.propertyCode}
                          onChange={(e) => setVisitForm({...visitForm, propertyCode: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                          placeholder="Enter property code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Visit Date *</label>
                        <input
                          type="date"
                          required
                          value={visitForm.visitDate}
                          onChange={(e) => setVisitForm({...visitForm, visitDate: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={visitForm.status}
                          onChange={(e) => setVisitForm({...visitForm, status: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        >
                          <option value="completed">Completed</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="rescheduled">Rescheduled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Interest</label>
                        <select
                          value={visitForm.customerInterest}
                          onChange={(e) => setVisitForm({...visitForm, customerInterest: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        >
                          <option value="very_interested">Very Interested</option>
                          <option value="interested">Interested</option>
                          <option value="not_interested">Not Interested</option>
                          <option value="need_to_decide">Need to Decide</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Next Follow-up Date</label>
                        <input
                          type="date"
                          value={visitForm.nextFollowUp}
                          onChange={(e) => setVisitForm({...visitForm, nextFollowUp: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Action</label>
                        <input
                          type="text"
                          value={visitForm.followUpAction}
                          onChange={(e) => setVisitForm({...visitForm, followUpAction: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                          placeholder="e.g., Call, Visit, Email"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                          rows={3}
                          value={visitForm.notes}
                          onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none"
                          placeholder="Visit notes..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                        <textarea
                          rows={3}
                          value={visitForm.feedback}
                          onChange={(e) => setVisitForm({...visitForm, feedback: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none"
                          placeholder="Customer feedback..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowVisitModal(false)}
                        className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium"
                      >
                        Record Visit
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Follow-up Modal */}
      <Transition appear show={showFollowUpModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowFollowUpModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-3xl bg-white rounded-2xl shadow-xl">
                  <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <ExclamationCircleIcon className="w-6 h-6 text-orange-500" />
                      Follow-up Due ({dueFollowUps.length})
                    </Dialog.Title>
                    <button onClick={() => setShowFollowUpModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {dueFollowUps.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-400 mb-4" />
                        <p className="text-gray-500 font-medium">No due follow-ups!</p>
                        <p className="text-gray-400 text-sm">All customers are up to date.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dueFollowUps.map((customer) => (
                          <div key={customer._id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{customer.name || 'Unknown'}</h4>
                                  <p className="text-sm text-gray-500">{customer.phone}</p>
                                  {customer.assignedAgent && (
                                    <p className="text-xs text-purple-600 mt-1">
                                      Agent: {customer.assignedAgent.name || 'Unassigned'}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  customer.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                  customer.status === 'interested' ? 'bg-green-100 text-green-700' :
                                  customer.status === 'visit-done' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {customer.status}
                                </span>
                                {customer.nextFollowUpDate && (
                                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1 justify-end">
                                    <CalendarDaysIcon className="w-3 h-3" />
                                    Due: {new Date(customer.nextFollowUpDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {customer.nextFollowUpAction && (
                              <div className="mt-3 bg-orange-50 rounded-lg p-2 text-sm text-orange-700">
                                <span className="font-medium">Action: </span>{customer.nextFollowUpAction}
                              </div>
                            )}
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => {
                                  setShowFollowUpModal(false);
                                  navigate('/dashboard/customers');
                                }}
                                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                              >
                                View Details →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
                    <button
                      onClick={() => setShowFollowUpModal(false)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
};

export default AdminDashboard;
