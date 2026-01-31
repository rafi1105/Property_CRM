import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerAPI, agentAPI, propertyAPI, authAPI } from '../utils/api';
import { formatDate, formatDateShort, formatDateWithWeekday, formatTime } from '../utils/dateFormat';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { locationData } from '../data/locations';
import {
  UsersIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  TagIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  TableCellsIcon,
  Squares2X2Icon,
  HomeModernIcon,
  ArrowsRightLeftIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// Helper function to extract note text properly
const getNoteText = (noteObj) => {
  if (!noteObj) return '';
  
  // Get the note field from the note object
  const noteField = noteObj.note;
  
  // If noteField is a string, return it directly
  if (typeof noteField === 'string') return noteField;
  
  // If noteField is an object (due to double-wrapping bug)
  if (noteField && typeof noteField === 'object') {
    // Check for note.note.note (triple nested due to bug)
    if (noteField.note && typeof noteField.note === 'string') return noteField.note;
    // Check for text or content properties
    if (noteField.text && typeof noteField.text === 'string') return noteField.text;
    if (noteField.content && typeof noteField.content === 'string') return noteField.content;
  }
  
  // Fallback: check other common properties on the main object
  if (noteObj.text && typeof noteObj.text === 'string') return noteObj.text;
  if (noteObj.content && typeof noteObj.content === 'string') return noteObj.content;
  
  // Last resort
  return '';
};

const CustomerManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAgentCloseModal, setShowAgentCloseModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [filterThana, setFilterThana] = useState('all');
  const [customerScope, setCustomerScope] = useState('own');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'assigned', 'self-added', 'agent-added'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [newNote, setNewNote] = useState('');
  const [noteFollowUpDate, setNoteFollowUpDate] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpAction, setNextFollowUpAction] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [moveData, setMoveData] = useState({
    zone: '',
    thana: '',
    agentId: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    priority: 'medium',
    status: 'new',
    source: 'website',
    requirements: '',
    budget: { min: '', max: '' },
    preferredLocation: '',
    propertyType: [],
    interestedProperties: '',
    interestedPropertyCode: '',
    assignedAgent: '',
    referredBy: '',
    customerZone: '',
    customerThana: '',
    nextFollowUpDate: ''
  });

  useEffect(() => {
    fetchCustomers();
    fetchProperties();
    if (user?.role !== 'agent') fetchAgents();
  }, [user]);

  // Refetch customers when sourceFilter changes
  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [sourceFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPriority, filterStatus, filterAgent, filterZone, filterThana, customerScope, sourceFilter]);

  // Handle edit query parameter from CustomerDetails page
  useEffect(() => {
    const editCustomerId = searchParams.get('edit');
    if (editCustomerId && customers.length > 0) {
      const customerToEdit = customers.find(c => c._id === editCustomerId);
      if (customerToEdit) {
        openEditModal(customerToEdit);
        setSearchParams({}); // Clear the query param after opening modal
      }
    }
  }, [searchParams, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 500 };
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;
      if (sourceFilter !== 'all') params.sourceFilter = sourceFilter;

      let response;
      if (customerScope === 'foreign') {
        response = await customerAPI.getForeignCustomers(params);
      } else {
        response = user?.role === 'agent' 
          ? await customerAPI.getMyCustomers({ sourceFilter: sourceFilter !== 'all' ? sourceFilter : undefined })
          : await customerAPI.getMyCustomers({ sourceFilter: sourceFilter !== 'all' ? sourceFilter : undefined });
      }
      
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data?.customers || []);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await propertyAPI.getAll({ page: 1, limit: 500 });
      setProperties(response.data.properties || response.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await authAPI.getAllUsers();
      const agentUsers = (response.data.users || []).filter(
        u => ['agent', 'admin', 'super_admin'].includes(u.role)
      );
      setAgents(agentUsers);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback to agentAPI
      try {
        const fallbackResponse = await agentAPI.getAll();
        setAgents(fallbackResponse.data?.agents || []);
      } catch (err) {
        console.error('Fallback agent fetch failed:', err);
      }
    }
  };

  // Client-side filtering
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || customer.priority === filterPriority;
    const matchesAgent = filterAgent === 'all' || 
      customer.assignedAgent?._id === filterAgent ||
      (!customer.assignedAgent && filterAgent === 'unassigned');
    const matchesZone = filterZone === 'all' || customer.customerZone === filterZone;
    const matchesThana = filterThana === 'all' || customer.customerThana === filterThana;

    return matchesSearch && matchesStatus && matchesPriority && matchesAgent && matchesZone && matchesThana;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('budget.')) {
      const budgetField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        budget: { ...prev.budget, [budgetField]: value }
      }));
    } else if (name === 'propertyType') {
      setFormData(prev => {
        const types = prev.propertyType || [];
        if (checked) {
          return { ...prev, propertyType: [...types, value] };
        } else {
          return { ...prev, propertyType: types.filter(t => t !== value) };
        }
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const customerData = {
        ...formData,
        budget: {
          min: Number(formData.budget.min) || 0,
          max: Number(formData.budget.max) || 0
        },
        preferredLocation: formData.preferredLocation ? formData.preferredLocation.split(',').map(l => l.trim()).filter(l => l) : []
      };

      // Remove email if empty
      if (!customerData.email || customerData.email.trim() === '') {
        delete customerData.email;
      }

      await customerAPI.create(customerData);
      toast.success('Customer created successfully!');
      setShowAddModal(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const customerData = {
        ...formData,
        budget: {
          min: Number(formData.budget.min) || 0,
          max: Number(formData.budget.max) || 0
        },
        preferredLocation: formData.preferredLocation ? formData.preferredLocation.split(',').map(l => l.trim()).filter(l => l) : []
      };

      // Remove email if empty
      if (!customerData.email || customerData.email.trim() === '') {
        delete customerData.email;
      }

      await customerAPI.update(selectedCustomer._id, customerData);
      toast.success('Customer updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(id);
        toast.success('Customer deleted successfully!');
        fetchCustomers();
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleMoveCustomer = async (e) => {
    e.preventDefault();
    try {
      await customerAPI.moveCustomer(selectedCustomer._id, moveData);
      toast.success('Customer moved successfully!');
      setShowMoveModal(false);
      setMoveData({ zone: '', thana: '', agentId: '' });
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to move customer');
    }
  };

  const handleAgentCloseCustomer = async () => {
    try {
      await customerAPI.agentCloseCustomer(selectedCustomer._id, closeReason);
      toast.success('Customer closed successfully!');
      setShowAgentCloseModal(false);
      setCloseReason('');
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close customer');
    }
  };

  const handleReopenCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to reopen this customer?')) return;
    try {
      await customerAPI.reopenCustomer(customerId);
      toast.success('Customer reopened successfully!');
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reopen customer');
    }
  };

  const openMoveModal = (customer) => {
    setSelectedCustomer(customer);
    setMoveData({
      zone: customer.customerZone || '',
      thana: customer.customerThana || '',
      agentId: ''
    });
    setShowMoveModal(true);
  };

  const openAgentCloseModal = (customer) => {
    setSelectedCustomer(customer);
    setCloseReason('');
    setShowAgentCloseModal(true);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const noteData = { note: newNote };
      if (noteFollowUpDate) {
        noteData.nextFollowUpDate = noteFollowUpDate;
      }
      await customerAPI.addNote(selectedCustomer._id, noteData);
      toast.success('Note added!');
      setNewNote('');
      setNoteFollowUpDate('');
      const response = await customerAPI.getById(selectedCustomer._id);
      setSelectedCustomer(response.data.customer || response.data);
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleUpdateFollowUp = async () => {
    if (!nextFollowUpDate && !nextFollowUpAction) return;
    try {
      await customerAPI.update(selectedCustomer._id, {
        nextFollowUpDate: nextFollowUpDate || selectedCustomer.nextFollowUpDate,
        nextFollowUpAction: nextFollowUpAction || selectedCustomer.nextFollowUpAction
      });
      toast.success('Follow-up updated!');
      setNextFollowUpDate('');
      setNextFollowUpAction('');
      const response = await customerAPI.getById(selectedCustomer._id);
      setSelectedCustomer(response.data.customer || response.data);
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to update follow-up');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      priority: 'medium',
      status: 'new',
      source: 'website',
      requirements: '',
      budget: { min: '', max: '' },
      preferredLocation: '',
      propertyType: [],
      interestedProperties: '',
      interestedPropertyCode: '',
      assignedAgent: '',
      referredBy: '',
      customerZone: '',
      customerThana: '',
      nextFollowUpDate: ''
    });
    setSelectedCustomer(null);
    setPropertySearchTerm('');
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      priority: customer.priority || 'medium',
      status: customer.status || 'new',
      source: customer.source || 'website',
      requirements: customer.requirements || '',
      budget: customer.budget || { min: '', max: '' },
      preferredLocation: Array.isArray(customer.preferredLocation) 
        ? customer.preferredLocation.join(', ') 
        : '',
      propertyType: customer.propertyType || [],
      interestedProperties: customer.interestedProperties || '',
      interestedPropertyCode: customer.interestedPropertyCode || '',
      assignedAgent: customer.assignedAgent?._id || customer.assignedAgent || '',
      referredBy: customer.referredBy || '',
      customerZone: customer.customerZone || '',
      customerThana: customer.customerThana || '',
      nextFollowUpDate: customer.nextFollowUpDate 
        ? new Date(customer.nextFollowUpDate).toISOString().split('T')[0] 
        : ''
    });
    setShowEditModal(true);
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  const statusColors = {
    'new': 'bg-blue-100 text-blue-700',
    'interested': 'bg-green-100 text-green-700',
    'visit-possible': 'bg-yellow-100 text-yellow-700',
    'visit-done': 'bg-purple-100 text-purple-700',
    'sellable': 'bg-emerald-100 text-emerald-700',
    'short-process': 'bg-orange-100 text-orange-700',
    'long-process': 'bg-indigo-100 text-indigo-700',
    'closed': 'bg-gray-100 text-gray-700'
  };

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterAgent !== 'all' || filterZone !== 'all' || filterThana !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterAgent('all');
    setFilterZone('all');
    setFilterThana('all');
  };

  return (
    <DashboardLayout title="Customers" subtitle="Manage your customer relationships">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4">
        {/* Top Row - View toggle, filters, and Add button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 sm:p-2.5 transition-colors ${viewMode === 'card' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Card View"
              >
                <Squares2X2Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 sm:p-2.5 transition-colors ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Table View"
              >
                <TableCellsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Customer Source Filter for Agents */}
            {user?.role === 'agent' && (
              <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden text-xs sm:text-sm">
                <button
                  onClick={() => { setSourceFilter('all'); }}
                  className={`px-2 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors ${sourceFilter === 'all' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  All
                </button>
                <button
                  onClick={() => { setSourceFilter('assigned'); }}
                  className={`px-2 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors ${sourceFilter === 'assigned' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Assigned
                </button>
                <button
                  onClick={() => { setSourceFilter('self-added'); }}
                  className={`px-2 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors ${sourceFilter === 'self-added' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="hidden sm:inline">Self Added</span>
                  <span className="sm:hidden">Self</span>
                </button>
              </div>
            )}

            {/* Customer Scope Toggle for Super Admin */}
            {user?.role === 'super_admin' && (
              <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden text-xs sm:text-sm">
                <button
                  onClick={() => { setSourceFilter('all'); }}
                  className={`px-2 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors ${sourceFilter === 'all' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="hidden sm:inline">All Customers</span>
                  <span className="sm:hidden">All</span>
                </button>
                <button
                  onClick={() => { setSourceFilter('agent-added'); }}
                  className={`px-2 sm:px-4 py-2 sm:py-2.5 font-medium transition-colors ${sourceFilter === 'agent-added' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="hidden sm:inline">Agent Customers</span>
                  <span className="sm:hidden">Agent</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium text-xs sm:text-sm"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
        {/* All Filters in One Row - scrollable on mobile */}
        <div className="flex flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          {/* Search */}
          <div className="relative min-w-[180px] sm:w-64 flex-shrink-0">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-xs sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-xs sm:text-sm flex-shrink-0"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="interested">Interested</option>
            <option value="visit-possible">Visit Possible</option>
            <option value="visit-done">Visit Done</option>
            <option value="sellable">Sellable</option>
            <option value="short-process">Short Process</option>
            <option value="long-process">Long Process</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-xs sm:text-sm flex-shrink-0"
          >
            <option value="all">Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Agent Filter (only for admin/super_admin) */}
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-xs sm:text-sm flex-shrink-0"
            >
              <option value="all">All Agents</option>
              <option value="unassigned">Unassigned</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>{agent.name}</option>
              ))}
            </select>
          )}

          {/* Zone Filter */}
          <select
            value={filterZone}
            onChange={(e) => { setFilterZone(e.target.value); setFilterThana('all'); }}
            className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-xs sm:text-sm flex-shrink-0"
          >
            <option value="all">All Zones</option>
            {Object.keys(locationData).map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>

          {/* Thana Filter */}
          <select
            value={filterThana}
            onChange={(e) => setFilterThana(e.target.value)}
            disabled={filterZone === 'all'}
            className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-xs sm:text-sm flex-shrink-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="all">All Thanas</option>
            {filterZone !== 'all' && locationData[filterZone] && Object.keys(locationData[filterZone]).map(thana => (
              <option key={thana} value={thana}>{thana}</option>
            ))}
          </select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-purple-900">
                  <XMarkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:text-blue-900">
                  <XMarkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            {filterPriority !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                {filterPriority}
                <button onClick={() => setFilterPriority('all')} className="hover:text-orange-900">
                  <XMarkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            {filterAgent !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {filterAgent === 'unassigned' ? 'Unassigned' : agents.find(a => a._id === filterAgent)?.name}
                <button onClick={() => setFilterAgent('all')} className="hover:text-green-900">
                  <XMarkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            {filterZone !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                {filterZone}
                <button onClick={() => { setFilterZone('all'); setFilterThana('all'); }} className="hover:text-teal-900">
                  <XMarkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            {filterThana !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                {filterThana}
                <button onClick={() => setFilterThana('all')} className="hover:text-cyan-900">
                  <XMarkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium ml-1 sm:ml-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* Results Count and Items Per Page */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs sm:text-sm text-gray-600">
            <span className="font-semibold">{filteredCustomers.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredCustomers.length)}</span> of <span className="font-semibold">{filteredCustomers.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-xs sm:text-sm"
            >
              <option value={12}>12</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Grid/Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No customers found</h3>
          <p className="text-gray-500">
            {customers.length === 0 
              ? 'Add your first customer to get started.'
              : 'Try adjusting your search criteria or filters.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 text-purple-600 hover:text-purple-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'card' ? (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCustomers.map((customer) => (
                <div key={customer._id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-shadow ${customer.isFollowUpDue ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-100 hover:shadow-md'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-lg">
                            {customer.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        {customer.isFollowUpDue && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <ClockIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {customer.name}
                          {customer.isFollowUpDue && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              Follow-up Due
                            </span>
                          )}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[customer.status] || statusColors.new}`}>
                          {customer.status}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${priorityColors[customer.priority] || priorityColors.medium}`}>
                      {customer.priority}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.referredBy && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <UserCircleIcon className="w-4 h-4 text-gray-400" />
                        <span className="truncate">Ref. By: {customer.referredBy}</span>
                      </div>
                    )}
                    {(customer.budget?.min || customer.budget?.max) && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <TagIcon className="w-4 h-4 text-gray-400" />
                        <span>Budget: ৳{customer.budget?.min?.toLocaleString() || 0} - ৳{customer.budget?.max?.toLocaleString() || 0}</span>
                      </div>
                    )}
                    {(customer.interestedProperties || customer.interestedPropertyCode) && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <HomeModernIcon className="w-4 h-4 text-gray-400" />
                        <span className="line-clamp-1">
                          {customer.interestedPropertyCode && <span className="font-medium text-purple-600">[{customer.interestedPropertyCode}]</span>}
                          {customer.interestedPropertyCode && customer.interestedProperties && ' '}
                          {customer.interestedProperties}
                        </span>
                      </div>
                    )}
                    {customer.propertyType?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {customer.propertyType.map(type => (
                          <span key={type} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                    {customer.nextFollowUpDate && (
                      <div className="flex items-center gap-2 text-sm mt-2">
                        <CalendarIcon className="w-4 h-4 text-orange-500" />
                        <span className={`${new Date(customer.nextFollowUpDate) <= new Date() ? 'text-red-600 font-medium' : 'text-orange-600'}`}>
                          Follow-up: {formatDate(customer.nextFollowUpDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {customer.requirements && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 bg-gray-50 p-2 rounded-lg">
                      {customer.requirements}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    {customer.assignedAgent && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {customer.assignedAgent?.name?.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{customer.assignedAgent?.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-auto flex-wrap">
                      <button
                        onClick={() => navigate(`/dashboard/customers/${customer._id}`)}
                        className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View
                      </button>
                      {!customer.agentClosed && (
                        <>
                          <button
                            onClick={() => openMoveModal(customer)}
                            className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            Move
                          </button>
                          <button
                            onClick={() => openAgentCloseModal(customer)}
                            className="px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {customer.agentClosed && user?.role !== 'agent' && (
                        <button
                          onClick={() => handleReopenCustomer(customer._id)}
                          className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Reopen
                        </button>
                      )}
                      {user?.role !== 'agent' && (
                        <>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer._id)}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-800 to-indigo-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Ref. By</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Budget</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Follow-up</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Agent</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedCustomers.map((customer, index) => (
                      <tr key={customer._id} className={`hover:bg-purple-50 transition-colors ${customer.agentClosed ? 'bg-gray-100 opacity-75' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`w-10 h-10 ${customer.agentClosed ? 'bg-gray-400' : 'bg-gradient-to-br from-purple-500 to-indigo-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                                <span className="text-white font-semibold">
                                  {customer.name?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                              {customer.isFollowUpDue && !customer.agentClosed && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                {customer.name}
                                {customer.agentClosed && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Closed</span>
                                )}
                              </div>
                              {customer.isFollowUpDue && !customer.agentClosed && (
                                <span className="text-xs text-orange-600">Follow-up Due</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{customer.phone}</div>
                          {customer.email && (
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">{customer.email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {customer.referredBy || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            ৳{customer.budget?.min?.toLocaleString() || 0} - ৳{customer.budget?.max?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {customer.nextFollowUpDate ? (
                            <span className={`text-xs font-medium ${new Date(customer.nextFollowUpDate) <= new Date() ? 'text-red-600 bg-red-50 px-2 py-1 rounded-lg' : 'text-orange-600 bg-orange-50 px-2 py-1 rounded-lg'}`}>
                              {formatDate(customer.nextFollowUpDate)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[customer.status] || statusColors.new}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${priorityColors[customer.priority] || priorityColors.medium}`}>
                            {customer.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {customer.assignedAgent?.name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              onClick={() => navigate(`/dashboard/customers/${customer._id}`)}
                              className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              View
                            </button>
                            {!customer.agentClosed && (
                              <>
                                <button
                                  onClick={() => openMoveModal(customer)}
                                  className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  Move
                                </button>
                                <button
                                  onClick={() => openAgentCloseModal(customer)}
                                  className="px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                >
                                  Close
                                </button>
                              </>
                            )}
                            {customer.agentClosed && user?.role !== 'agent' && (
                              <button
                                onClick={() => handleReopenCustomer(customer._id)}
                                className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                Reopen
                              </button>
                            )}
                            {user?.role !== 'agent' && (
                              <>
                                <button
                                  onClick={() => openEditModal(customer)}
                                  className="px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(customer._id)}
                                  className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  <ChevronLeftIcon className="w-5 h-5 -ml-3" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => (
                    <span key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex"
                  title="Last Page"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                  <ChevronRightIcon className="w-5 h-5 -ml-3" />
                </button>
              </div>
            </div>
          )}
        </>
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
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
                  <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">
                      {showEditModal ? 'Edit Customer' : 'Add New Customer'}
                    </Dialog.Title>
                    <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={showEditModal ? handleUpdate : handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Customer name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                        <input
                          type="tel"
                          required
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Email address (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="new">New</option>
                          <option value="interested">Interested</option>
                          <option value="visit-possible">Visit Possible</option>
                          <option value="visit-done">Visit Done</option>
                          <option value="sellable">Sellable</option>
                          <option value="short-process">Short Process</option>
                          <option value="long-process">Long Process</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                        <select
                          name="source"
                          value={formData.source}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="website">Website</option>
                          <option value="referral">Referral</option>
                          <option value="social_media">Social Media</option>
                          <option value="walk_in">Walk In</option>
                          <option value="call">Call</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Referred By</label>
                        <input
                          type="text"
                          name="referredBy"
                          value={formData.referredBy}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Name of referrer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Budget Min (৳)</label>
                        <input
                          type="number"
                          name="budget.min"
                          value={formData.budget.min}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Minimum budget"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Budget Max (৳)</label>
                        <input
                          type="number"
                          name="budget.max"
                          value={formData.budget.max}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Maximum budget"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Locations (comma-separated)</label>
                        <input
                          type="text"
                          name="preferredLocation"
                          value={formData.preferredLocation}
                          onChange={handleInputChange}
                          placeholder="e.g., Gulshan, Dhanmondi, Uttara"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Property Types</label>
                        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                          {['land', 'building', 'house', 'apartment', 'commercial', 'villa', 'penthouse'].map(type => (
                            <label key={type} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                name="propertyType"
                                value={type}
                                checked={formData.propertyType.includes(type)}
                                onChange={handleInputChange}
                                className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                              />
                              <span className="text-sm capitalize text-gray-700">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Interested Properties</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <textarea
                              name="interestedProperties"
                              value={formData.interestedProperties}
                              onChange={handleInputChange}
                              rows={3}
                              placeholder="Enter interested property details, locations, or requirements..."
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Property Code</label>
                            <input
                              type="text"
                              name="interestedPropertyCode"
                              value={formData.interestedPropertyCode}
                              onChange={handleInputChange}
                              placeholder="e.g. PROP-001"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                            />
                            <p className="text-xs text-gray-400 mt-1">Enter property code if known</p>
                          </div>
                        </div>
                      </div>

                      {/* Assign Agent Section */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign Handler</label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Select Zone</label>
                            <select
                              name="customerZone"
                              value={formData.customerZone}
                              onChange={(e) => {
                                const zone = e.target.value;
                                setFormData(prev => ({ 
                                  ...prev, 
                                  customerZone: zone,
                                  customerThana: '',
                                  assignedAgent: ''
                                }));
                              }}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                            >
                              <option value="">Select Zone</option>
                              {Object.keys(locationData).map(zone => (
                                <option key={zone} value={zone}>{zone}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Select Thana</label>
                            <select
                              name="customerThana"
                              value={formData.customerThana}
                              onChange={(e) => {
                                const thana = e.target.value;
                                setFormData(prev => ({ 
                                  ...prev, 
                                  customerThana: thana,
                                  assignedAgent: ''
                                }));
                              }}
                              disabled={!formData.customerZone}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">Select Thana</option>
                              {formData.customerZone && locationData[formData.customerZone] && Object.keys(locationData[formData.customerZone]).map(thana => (
                                <option key={thana} value={thana}>{thana}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {user?.role !== 'agent' && (
                          <>
                            <select
                              name="assignedAgent"
                              value={formData.assignedAgent}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                            >
                              <option value="">
                                {formData.customerZone ? 'Select Agent' : 'Select Agent (or choose zone first)'}
                              </option>
                              {agents
                                .filter(agent => 
                                  agent.isActive !== false && 
                                  (!formData.customerZone || agent.assignedZone === formData.customerZone) &&
                                  (!formData.customerThana || agent.assignedThana === formData.customerThana)
                                )
                                .map(agent => (
                                  <option key={agent._id} value={agent._id}>
                                    {agent.name} {agent.assignedZone ? `(${agent.assignedZone}${agent.assignedThana ? ` - ${agent.assignedThana}` : ''})` : ''}
                                  </option>
                                ))}
                            </select>
                            {formData.customerZone && (
                              <p className="text-xs text-gray-500 mt-1">
                                Showing agents in: {formData.customerZone}{formData.customerThana ? ` - ${formData.customerThana}` : ''}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Next Follow-up Date</label>
                        <input
                          type="date"
                          name="nextFollowUpDate"
                          value={formData.nextFollowUpDate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes/Requirements</label>
                        <textarea
                          rows={3}
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
                          placeholder="Customer requirements, notes..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium">
                        {showEditModal ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* View Modal with Notes & Communication Log */}
      <Transition appear show={showViewModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowViewModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
                  {selectedCustomer && (
                    <>
                      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                        <Dialog.Title className="text-xl font-semibold text-gray-900">Customer Details</Dialog.Title>
                        <button onClick={() => setShowViewModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {/* Customer Header */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">{selectedCustomer.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedCustomer.status]}`}>
                                {selectedCustomer.status}
                              </span>
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${priorityColors[selectedCustomer.priority]}`}>
                                {selectedCustomer.priority} priority
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {selectedCustomer.email && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                              <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-700 truncate">{selectedCustomer.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            <PhoneIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-700">{selectedCustomer.phone}</span>
                          </div>
                        </div>

                        {/* Budget & Preferences */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <span className="text-xs font-medium text-gray-500">Budget Range</span>
                              <p className="text-gray-900 font-semibold">
                                ৳{selectedCustomer.budget?.min?.toLocaleString() || 0} - ৳{selectedCustomer.budget?.max?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <span className="text-xs font-medium text-gray-500">Assigned Agent</span>
                              <p className="text-gray-900 font-semibold">{selectedCustomer.assignedAgent?.name || 'Unassigned'}</p>
                            </div>
                          </div>
                          {selectedCustomer.preferredLocation?.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                              <span className="text-xs font-medium text-gray-500">Preferred Locations</span>
                              <p className="text-gray-900">{selectedCustomer.preferredLocation.join(', ')}</p>
                            </div>
                          )}
                          {selectedCustomer.propertyType?.length > 0 && (
                            <div className="mt-3">
                              <span className="text-xs font-medium text-gray-500">Property Types</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {selectedCustomer.propertyType.map(type => (
                                  <span key={type} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs capitalize">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interested Properties */}
                        {(selectedCustomer.interestedProperties || selectedCustomer.interestedPropertyCode) && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3">Interested Properties</h4>
                            <div className="p-3 bg-gray-50 rounded-xl">
                              {selectedCustomer.interestedPropertyCode && (
                                <div className="mb-2">
                                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                                    Property Code: {selectedCustomer.interestedPropertyCode}
                                  </span>
                                </div>
                              )}
                              {selectedCustomer.interestedProperties && (
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedCustomer.interestedProperties}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedCustomer.requirements && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-xl">{selectedCustomer.requirements}</p>
                          </div>
                        )}

                        {/* Next Follow-up Section */}
                        <div className="mb-6 border border-blue-200 bg-blue-50 rounded-xl p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                            Next Follow-up
                          </h4>
                          
                          {selectedCustomer.nextFollowUpDate && (
                            <div className="mb-3 p-3 bg-white rounded-lg">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Date:</span> {formatDateWithWeekday(selectedCustomer.nextFollowUpDate)}
                              </p>
                              {typeof selectedCustomer.nextFollowUpAction === 'string' && selectedCustomer.nextFollowUpAction && (
                                <p className="text-sm text-gray-700 mt-1">
                                  <span className="font-medium">Action:</span> {selectedCustomer.nextFollowUpAction}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="space-y-2">
                            <input
                              type="date"
                              value={nextFollowUpDate}
                              onChange={(e) => setNextFollowUpDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                              min={new Date().toISOString().split('T')[0]}
                            />
                            <input
                              type="text"
                              value={nextFollowUpAction}
                              onChange={(e) => setNextFollowUpAction(e.target.value)}
                              placeholder="Follow-up action (e.g., Call, Visit, Email)"
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                            />
                            <button
                              onClick={handleUpdateFollowUp}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                              Update Follow-up
                            </button>
                          </div>
                        </div>

                        {/* Communication Log / Notes Section */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-gray-900">Communication Log</h4>
                            <span className="text-sm text-gray-500">
                              {selectedCustomer.notes?.length || 0} {selectedCustomer.notes?.length === 1 ? 'entry' : 'entries'}
                            </span>
                          </div>

                          {/* Add Note Input */}
                          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <label className="flex justify-between items-center text-sm font-medium text-gray-700 mb-2">
                              <span>📝 Add New Entry</span>
                              <span className="text-xs text-gray-500 font-normal">Posting as: <span className="font-medium text-purple-600">{user?.name}</span></span>
                            </label>
                            <textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Record a call, meeting, email, or any customer interaction..."
                              rows="3"
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  handleAddNote();
                                }
                              }}
                            />
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 font-medium">Next Follow-up:</label>
                                <input
                                  type="date"
                                  value={noteFollowUpDate}
                                  onChange={(e) => setNoteFollowUpDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Ctrl+Enter to send</span>
                                <button
                                  onClick={handleAddNote}
                                  disabled={!newNote.trim()}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                  Add Entry
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Communication Timeline */}
                          <div className="bg-gray-50 rounded-xl p-4 max-h-72 overflow-y-auto">
                            {selectedCustomer.notes?.length > 0 ? (
                              <div className="space-y-4">
                                {selectedCustomer.notes
                                  .slice()
                                  .sort((a, b) => new Date(b.addedAt || b.createdAt) - new Date(a.addedAt || a.createdAt))
                                  .map((note, index) => {
                                    const noteDate = new Date(note.addedAt || note.createdAt);
                                    const isToday = noteDate.toDateString() === new Date().toDateString();
                                    const isYesterday = new Date(noteDate.getTime() + 86400000).toDateString() === new Date().toDateString();
                                    
                                    let dateLabel = formatDate(noteDate);
                                    if (isToday) dateLabel = 'Today';
                                    else if (isYesterday) dateLabel = 'Yesterday';

                                    const getAuthorName = (note) => {
                                      if (note.addedBy?.name) return note.addedBy.name;
                                      if (note.addedBy === user?._id || note.addedBy?._id === user?._id) return user?.name;
                                      if (typeof note.addedBy === 'string') {
                                        const agent = agents.find(a => a._id === note.addedBy);
                                        if (agent) return agent.name;
                                      }
                                      return 'Admin';
                                    };

                                    const authorName = getAuthorName(note);

                                    return (
                                      <div key={index} className="relative">
                                        {index < selectedCustomer.notes.length - 1 && (
                                          <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-purple-200"></div>
                                        )}
                                        
                                        <div className="flex gap-3">
                                          <div className="shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm z-10">
                                            {authorName.charAt(0).toUpperCase()}
                                          </div>
                                          
                                          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="p-3">
                                              <div className="flex justify-between items-start mb-2">
                                                <div>
                                                  <p className="text-sm font-semibold text-gray-900">{authorName}</p>
                                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{dateLabel}</span>
                                                    <span>•</span>
                                                    <span>{formatTime(noteDate)}</span>
                                                  </div>
                                                </div>
                                                {index === 0 && (
                                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                    Latest
                                                  </span>
                                                )}
                                              </div>
                                              
                                              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                                {getNoteText(note)}
                                              </p>
                                              
                                              {/* Show Follow-up Date if exists */}
                                              {note.nextFollowUpDate && (
                                                <div className="mt-2 flex items-center gap-2 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg w-fit">
                                                  <CalendarIcon className="w-3 h-3" />
                                                  <span>Follow-up: {formatDate(note.nextFollowUpDate)}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <ChatBubbleLeftIcon className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">No communication history yet</p>
                                <p className="text-gray-400 text-sm mt-1">Start by adding your first interaction note above</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Move Customer Modal */}
      <Transition appear show={showMoveModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowMoveModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl">
                  <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">Move Customer</Dialog.Title>
                    <button onClick={() => setShowMoveModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleMoveCustomer} className="p-6 space-y-4">
                    {selectedCustomer && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{selectedCustomer.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                            <p className="text-sm text-gray-500">
                              Current Agent: {selectedCustomer.assignedAgent?.name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Zone</label>
                      <select
                        value={moveData.zone}
                        onChange={(e) => setMoveData({ ...moveData, zone: e.target.value, thana: '', agentId: '' })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                      >
                        <option value="">Select Zone</option>
                        {Object.keys(locationData).map(zone => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Thana</label>
                      <select
                        value={moveData.thana}
                        onChange={(e) => setMoveData({ ...moveData, thana: e.target.value, agentId: '' })}
                        disabled={!moveData.zone}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Thana</option>
                        {moveData.zone && locationData[moveData.zone] && Object.keys(locationData[moveData.zone]).map(thana => (
                          <option key={thana} value={thana}>{thana}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Agent</label>
                      <select
                        value={moveData.agentId}
                        onChange={(e) => setMoveData({ ...moveData, agentId: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                      >
                        <option value="">Select Agent</option>
                        {agents
                          .filter(agent => 
                            agent.isActive !== false && 
                            (!moveData.zone || agent.assignedZone === moveData.zone) &&
                            (!moveData.thana || agent.assignedThana === moveData.thana)
                          )
                          .map(agent => (
                            <option key={agent._id} value={agent._id}>
                              {agent.name} {agent.assignedZone ? `(${agent.assignedZone}${agent.assignedThana ? ` - ${agent.assignedThana}` : ''})` : ''}
                            </option>
                          ))}
                      </select>
                      {moveData.zone && (
                        <p className="text-xs text-gray-500 mt-1">
                          Showing agents in: {moveData.zone}{moveData.thana ? ` - ${moveData.thana}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button type="button" onClick={() => setShowMoveModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg font-medium">
                        Move Customer
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Agent Close Modal */}
      <Transition appear show={showAgentCloseModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowAgentCloseModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl">
                  <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">Close Customer</Dialog.Title>
                    <button onClick={() => setShowAgentCloseModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {selectedCustomer && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                            <XCircleIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Closing: {selectedCustomer.name}</p>
                            <p className="text-sm text-orange-700">
                              This will mark the customer as closed and remove from active list.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Closing</label>
                      <select
                        value={closeReason}
                        onChange={(e) => setCloseReason(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 mb-3"
                      >
                        <option value="">Select a reason</option>
                        <option value="Not interested">Not interested</option>
                        <option value="Budget mismatch">Budget mismatch</option>
                        <option value="Location preference changed">Location preference changed</option>
                        <option value="Bought from competitor">Bought from competitor</option>
                        <option value="No response/Unreachable">No response / Unreachable</option>
                        <option value="Invalid/Fake lead">Invalid / Fake lead</option>
                        <option value="Duplicate entry">Duplicate entry</option>
                        <option value="Other">Other</option>
                      </select>
                      <textarea
                        value={closeReason === 'Other' ? '' : closeReason}
                        onChange={(e) => setCloseReason(e.target.value)}
                        placeholder="Add additional notes (optional)..."
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button 
                        type="button" 
                        onClick={() => setShowAgentCloseModal(false)} 
                        className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAgentCloseCustomer}
                        disabled={!closeReason}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Close Customer
                      </button>
                    </div>
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

export default CustomerManagement;
