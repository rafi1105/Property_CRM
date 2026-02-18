import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, agentAPI, customerAPI, propertyAPI, authAPI } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { locationData } from '../data/locations';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const TaskManager = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Advanced filters
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDueDateFrom, setFilterDueDateFrom] = useState('');
  const [filterDueDateTo, setFilterDueDateTo] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [filterThana, setFilterThana] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'follow_up',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    assignedTo: '',
    customer: '',
    property: ''
  });

  useEffect(() => {
    fetchTasks();
    // Only fetch agents if user is not an agent (agents can't access agent list)
    if (user?.role !== 'agent') {
      fetchAgents();
    }
    fetchCustomers();
    fetchProperties();
  }, [activeFilter, user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = activeFilter !== 'all' ? { status: activeFilter } : {};
      const response = await taskAPI.getAll(params);
      setTasks(response.data?.tasks || response.data || []);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await authAPI.getAllUsers();
      const agentUsers = (response.data.users || []).filter(
        u => ['agent', 'admin', 'super_admin'].includes(u.role) && u.isActive !== false
      );
      setAgents(agentUsers);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Use appropriate API endpoint based on user role
      const response = user?.role === 'agent'
        ? await customerAPI.getMyCustomers()
        : await customerAPI.getAll({ limit: 100 });
      setCustomers(response.data?.customers || response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await propertyAPI.getAll({ limit: 100 });
      setProperties(response.data?.properties || response.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create(formData);
      toast.success('Task created successfully!');
      setShowAddModal(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.update(selectedTask._id, formData);
      toast.success('Task updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast.success('Status updated!');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      try {
        await taskAPI.delete(id);
        toast.success('Task deleted!');
        fetchTasks();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'follow_up',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      assignedTo: '',
      customer: '',
      property: ''
    });
    setSelectedTask(null);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      type: task.type || 'follow_up',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assignedTo: task.assignedTo?._id || '',
      customer: task.customer?._id || '',
      property: task.property?._id || ''
    });
    setShowEditModal(true);
  };

  // Apply advanced filters to tasks
  const applyAdvancedFilters = (taskList) => {
    return taskList.filter(task => {
      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }
      
      // Type filter
      if (filterType !== 'all' && task.type !== filterType) {
        return false;
      }
      
      // Assigned to filter
      if (filterAssignedTo !== 'all') {
        if (filterAssignedTo === 'unassigned' && task.assignedTo) {
          return false;
        }
        if (filterAssignedTo !== 'unassigned' && task.assignedTo?._id !== filterAssignedTo) {
          return false;
        }
      }
      
      // Zone filter - check customer's zone
      if (filterZone !== 'all') {
        if (!task.customer || task.customer.zone !== filterZone) {
          return false;
        }
      }
      
      // Thana filter - check customer's thana
      if (filterThana !== 'all') {
        if (!task.customer || task.customer.thana !== filterThana) {
          return false;
        }
      }
      
      // Due date filter - date range
      if ((filterDueDateFrom || filterDueDateTo) && task.dueDate) {
        const taskDueDate = new Date(task.dueDate);
        taskDueDate.setHours(0, 0, 0, 0);
        
        if (filterDueDateFrom) {
          const fromDate = new Date(filterDueDateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (taskDueDate < fromDate) return false;
        }
        
        if (filterDueDateTo) {
          const toDate = new Date(filterDueDateTo);
          toDate.setHours(23, 59, 59, 999);
          if (taskDueDate > toDate) return false;
        }
      }
      
      return true;
    });
  };

  // Reset all filters
  const resetAllFilters = () => {
    setActiveFilter('all');
    setFilterPriority('all');
    setFilterType('all');
    setFilterDueDateFrom('');
    setFilterDueDateTo('');
    setFilterAssignedTo('all');
    setFilterZone('all');
    setFilterThana('all');
  };
  
  // Get available thanas for selected zone
  const getAvailableThanas = () => {
    if (filterZone === 'all' || !locationData[filterZone]) return [];
    return Object.keys(locationData[filterZone]);
  };
  
  // Get zones assigned to the selected agent (from their customers)
  const getAgentZones = () => {
    if (filterAssignedTo === 'all' || filterAssignedTo === 'unassigned') {
      return Object.keys(locationData);
    }
    
    // Get unique zones from customers assigned to this agent
    const agentCustomers = customers.filter(c => c.assignedAgent?._id === filterAssignedTo);
    const zones = [...new Set(agentCustomers.map(c => c.zone).filter(Boolean))];
    return zones;
  };
  
  // Get thanas for selected agent and zone
  const getAgentThanas = () => {
    if (filterZone === 'all' || !locationData[filterZone]) return [];
    
    if (filterAssignedTo === 'all' || filterAssignedTo === 'unassigned') {
      return Object.keys(locationData[filterZone]);
    }
    
    // Get unique thanas from customers assigned to this agent in this zone
    const agentCustomers = customers.filter(c => 
      c.assignedAgent?._id === filterAssignedTo && c.zone === filterZone
    );
    const thanas = [...new Set(agentCustomers.map(c => c.thana).filter(Boolean))];
    return thanas;
  };

  // Get filtered tasks
  const filteredTasks = applyAdvancedFilters(tasks);

  // Check if any advanced filter is active
  const hasActiveFilters = filterPriority !== 'all' || filterType !== 'all' || 
    filterDueDateFrom !== '' || filterDueDateTo !== '' || filterAssignedTo !== 'all' || filterZone !== 'all' || filterThana !== 'all';

  const filters = [
    { key: 'all', label: 'All Tasks', icon: ClipboardDocumentListIcon },
    { key: 'pending', label: 'Pending', icon: ClockIcon },
    { key: 'in_progress', label: 'In Progress', icon: ExclamationTriangleIcon },
    { key: 'completed', label: 'Completed', icon: CheckCircleIcon },
  ];

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const taskStats = {
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
  };

  return (
    <DashboardLayout title="Tasks" subtitle="Manage your tasks and activities">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total Tasks</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{taskStats.total}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{taskStats.pending}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">In Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{taskStats.inProgress}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{taskStats.completed}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Add Button */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Filter buttons - scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                activeFilter === filter.key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <filter.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-xs sm:text-sm ${
              showFilters || hasActiveFilters
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Advanced Filters</span>
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                Active
              </span>
            )}
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium text-sm"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Filter Tasks</h3>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Reset All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Priority filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              {/* Type filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Task Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="all">All Types</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="viewing">Property Viewing</option>
                  <option value="document">Documentation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {/* Due date from filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Due Date From</label>
                <input
                  type="date"
                  value={filterDueDateFrom}
                  onChange={(e) => setFilterDueDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              {/* Due date to filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Due Date To</label>
                <input
                  type="date"
                  value={filterDueDateTo}
                  onChange={(e) => setFilterDueDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
            </div>
            
            {/* Second row for Assigned To, Zone and Thana filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {/* Assigned to filter (only for non-agents) */}
              {user?.role !== 'agent' && agents.length > 0 && (
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Assigned To</label>
                  <select
                    value={filterAssignedTo}
                    onChange={(e) => {
                      setFilterAssignedTo(e.target.value);
                      setFilterZone('all'); // Reset zone when agent changes
                      setFilterThana('all'); // Reset thana when agent changes
                    }}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  >
                    <option value="all">All Agents</option>
                    <option value="unassigned">Unassigned</option>
                    {agents.map(agent => (
                      <option key={agent._id} value={agent._id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Zone filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  Zone
                  {filterAssignedTo !== 'all' && filterAssignedTo !== 'unassigned' && (
                    <span className="ml-1 text-[10px] text-purple-600">
                      (Agent's areas)
                    </span>
                  )}
                </label>
                <select
                  value={filterZone}
                  onChange={(e) => {
                    setFilterZone(e.target.value);
                    setFilterThana('all'); // Reset thana when zone changes
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="all">All Zones</option>
                  {getAgentZones().map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
              {/* Thana filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  Thana
                  {filterAssignedTo !== 'all' && filterAssignedTo !== 'unassigned' && filterZone !== 'all' && (
                    <span className="ml-1 text-[10px] text-purple-600">
                      (Agent's areas)
                    </span>
                  )}
                </label>
                <select
                  value={filterThana}
                  onChange={(e) => setFilterThana(e.target.value)}
                  disabled={filterZone === 'all'}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="all">All Thanas</option>
                  {getAgentThanas().map(thana => (
                    <option key={thana} value={thana}>{thana}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        )}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredTasks.map((task) => (
            <div key={task._id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Task Header */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleStatusChange(task._id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      task.status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-purple-500'
                    }`}
                  >
                    {task.status === 'completed' && <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-gray-900 text-sm sm:text-base ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                </div>

                {/* Task Meta Info */}
                <div className="flex flex-wrap items-center gap-2 ml-8 sm:ml-9">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${priorityColors[task.priority]}`}>
                    <FlagIcon className="w-3 h-3 inline mr-1" />
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[task.status]}`}>
                    {task.status?.replace('_', ' ')}
                  </span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <CalendarDaysIcon className="w-3 h-3" />
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.assignedTo && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                      <UserIcon className="w-3 h-3" />
                      {task.assignedTo?.name}
                    </span>
                  )}
                  {task.customer && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {task.customer?.name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-8 sm:ml-9 pt-2 border-t border-gray-100 sm:border-0 sm:pt-0">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ color: '#111827' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => openEditModal(task)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                {tasks.length === 0 ? 'No tasks found' : 'No tasks match your filters'}
              </h3>
              <p className="text-gray-500 mt-1">
                {tasks.length === 0 
                  ? 'Create your first task to get started' 
                  : 'Try adjusting your filters to see more tasks'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Transition appear show={showAddModal || showEditModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl">
                  <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">
                      {showEditModal ? 'Edit Task' : 'Create New Task'}
                    </Dialog.Title>
                    <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={showEditModal ? handleUpdate : handleSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        placeholder="Enter task title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
                        placeholder="Task description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="follow_up">Follow Up</option>
                          <option value="meeting">Meeting</option>
                          <option value="call">Call</option>
                          <option value="viewing">Property Viewing</option>
                          <option value="document">Documentation</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                    </div>

                    {user?.role !== 'agent' && agents.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                        <select
                          value={formData.assignedTo}
                          onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="">Select Agent</option>
                          {agents.map(agent => (
                            <option key={agent._id} value={agent._id}>{agent.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Related Customer</label>
                        <select
                          value={formData.customer}
                          onChange={(e) => setFormData({...formData, customer: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="">None</option>
                          {customers.map(customer => (
                            <option key={customer._id} value={customer._id}>{customer.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Related Property</label>
                        <select
                          value={formData.property}
                          onChange={(e) => setFormData({...formData, property: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="">None</option>
                          {properties.map(property => (
                            <option key={property._id} value={property._id}>{property.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium">
                        {showEditModal ? 'Update Task' : 'Create Task'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
};

export default TaskManager;
