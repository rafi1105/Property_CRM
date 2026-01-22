import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminNavbar from '../components/AdminNavbar';
import { customerAPI, propertyAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { locationData } from '../data/locations';

const CustomerManagement = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    budget: { min: '', max: '' },
    preferredLocation: '',
    propertyType: [],
    interestedProperties: [],
    status: 'new',
    priority: 'medium',
    source: 'website',
    assignedAgent: '',
    nextFollowUpDate: '',
    customerZone: '',
    customerThana: ''
  });
  const [noteText, setNoteText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [filterThana, setFilterThana] = useState('all');
  const [propertySearchTerm, setPropertySearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchProperties();
    fetchAgents();
  }, [user]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = user?.role === 'agent' 
        ? await customerAPI.getMyCustomers()
        : await customerAPI.getAll({ page: 1, limit: 100 });
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await propertyAPI.getAll({ page: 1, limit: 100 });
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await authAPI.getAllUsers();
      // Allow assigning to any staff member (agent, admin, or super_admin)
      const agentUsers = (response.data.users || []).filter(
        u => ['agent', 'admin', 'super_admin'].includes(u.role)
      );
      setAgents(agentUsers);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // If we can't fetch users (e.g. permission issue), we just won't show the list
      // But we should try to handle it gracefully
    }
  };

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
    } else if (name === 'interestedProperties') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({ ...prev, interestedProperties: selectedOptions }));
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
        preferredLocation: formData.preferredLocation.split(',').map(l => l.trim()).filter(l => l)
      };

      // Remove email if empty to avoid validation error
      if (!customerData.email || customerData.email.trim() === '') {
        delete customerData.email;
      }

      console.log('Submitting customer data:', customerData);

      if (showEditModal && selectedCustomer) {
        await customerAPI.update(selectedCustomer._id, customerData);
        toast.success('Customer updated successfully');
      } else {
        const response = await customerAPI.create(customerData);
        console.log('Customer created:', response);
        toast.success('Customer created successfully');
      }

      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      budget: {
        min: customer.budget?.min || '',
        max: customer.budget?.max || ''
      },
      preferredLocation: Array.isArray(customer.preferredLocation) 
        ? customer.preferredLocation.join(', ') 
        : '',
      propertyType: customer.propertyType || [],
      interestedProperties: customer.interestedProperties?.map(p => p._id || p) || [],
      status: customer.status || 'new',
      priority: customer.priority || 'medium',
      source: customer.source || 'website',
      assignedAgent: customer.assignedAgent?._id || customer.assignedAgent || '',
      nextFollowUpDate: customer.nextFollowUpDate 
        ? new Date(customer.nextFollowUpDate).toISOString().split('T')[0] 
        : '',
      customerZone: customer.customerZone || '',
      customerThana: customer.customerThana || ''
    });
    setShowEditModal(true);
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await customerAPI.delete(id);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    
    try {
      await customerAPI.addNote(selectedCustomer._id, noteText);
      toast.success('Note added successfully');
      setNoteText('');
      
      // Refresh customer details
      const response = await customerAPI.getById(selectedCustomer._id);
      setSelectedCustomer(response.data.customer);
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleAssignAgent = async (customerId, agentId) => {
    try {
      await customerAPI.assignAgent(customerId, agentId);
      toast.success('Agent assigned successfully');
      fetchCustomers();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign agent');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      budget: { min: '', max: '' },
      preferredLocation: '',
      propertyType: [],
      interestedProperties: [],
      status: 'new',
      priority: 'medium',
      source: 'website',
      assignedAgent: '',
      nextFollowUpDate: '',
      customerZone: '',
      customerThana: ''
    });
    setSelectedCustomer(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      interested: 'bg-purple-100 text-purple-800',
      'visit-possible': 'bg-yellow-100 text-yellow-800',
      'visit-done': 'bg-cyan-100 text-cyan-800',
      sellable: 'bg-green-100 text-green-800',
      'short-process': 'bg-orange-100 text-orange-800',
      'long-process': 'bg-pink-100 text-pink-800',
      closed: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Filter and search logic
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm);

    // Status filter
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;

    // Priority filter
    const matchesPriority = filterPriority === 'all' || customer.priority === filterPriority;

    // Agent filter (only for admin/super_admin)
    const matchesAgent = filterAgent === 'all' || 
      customer.assignedAgent?._id === filterAgent ||
      (!customer.assignedAgent && filterAgent === 'unassigned');

    // Zone filter
    const matchesZone = filterZone === 'all' || customer.customerZone === filterZone;

    // Thana filter
    const matchesThana = filterThana === 'all' || customer.customerThana === filterThana;

    return matchesSearch && matchesStatus && matchesPriority && matchesAgent && matchesZone && matchesThana;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {user?.role === 'agent' ? 'My Customers' : 'Customer Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage customer leads, property interests, and communications
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Customer</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Agent Filter (only for admin/super_admin) */}
            {(user?.role === 'super_admin' || user?.role === 'admin') && (
              <div>
                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Agents</option>
                  <option value="unassigned">Unassigned</option>
                  {agents.map(agent => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Zone Filter */}
            <div>
              <select
                value={filterZone}
                onChange={(e) => {
                  setFilterZone(e.target.value);
                  setFilterThana('all');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Zones</option>
                {Object.keys(locationData).map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* Thana Filter */}
            <div>
              <select
                value={filterThana}
                onChange={(e) => setFilterThana(e.target.value)}
                disabled={filterZone === 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">All Thanas</option>
                {filterZone !== 'all' && locationData[filterZone] && Object.keys(locationData[filterZone]).map(thana => (
                  <option key={thana} value={thana}>{thana}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterAgent !== 'all' || filterZone !== 'all' || filterThana !== 'all') && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-purple-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterPriority !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Priority: {filterPriority}
                  <button onClick={() => setFilterPriority('all')} className="hover:text-orange-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterAgent !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Agent: {filterAgent === 'unassigned' ? 'Unassigned' : agents.find(a => a._id === filterAgent)?.name}
                  <button onClick={() => setFilterAgent('all')} className="hover:text-green-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterZone !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">
                  Zone: {filterZone}
                  <button onClick={() => { setFilterZone('all'); setFilterThana('all'); }} className="hover:text-cyan-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterThana !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                  Thana: {filterThana}
                  <button onClick={() => setFilterThana('all')} className="hover:text-teal-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setFilterAgent('all');
                  setFilterZone('all');
                  setFilterThana('all');
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">
                {customers.length === 0 
                  ? 'No customers found. Add your first customer to get started.'
                  : 'No customers match your filters. Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {customer.interestedProperties?.length || 0} properties interested
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ৳{customer.budget?.min?.toLocaleString()} - ৳{customer.budget?.max?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(customer.priority)}`}>
                          {customer.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.assignedAgent?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(customer)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          View
                        </button>
                        {user?.role !== 'agent' && (
                          <>
                            <button
                              onClick={() => handleEdit(customer)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(customer._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {showEditModal ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="walk_in">Walk In</option>
                    <option value="call">Call</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget</label>
                  <input
                    type="number"
                    name="budget.min"
                    value={formData.budget.min}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
                  <input
                    type="number"
                    name="budget.max"
                    value={formData.budget.max}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Locations (comma-separated)
                </label>
                <input
                  type="text"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., Downtown, Suburbs, Beachfront"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Types</label>
                <div className="grid grid-cols-4 gap-2">
                  {['land', 'building', 'house', 'apartment', 'commercial', 'villa', 'penthouse'].map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="propertyType"
                        value={type}
                        checked={formData.propertyType.includes(type)}
                        onChange={handleInputChange}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interested Properties
                </label>
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchTerm}
                  onChange={(e) => setPropertySearchTerm(e.target.value)}
                  className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto bg-white">
                  {properties.length > 0 ? (
                    properties
                      .filter(p => 
                        p.name.toLowerCase().includes(propertySearchTerm.toLowerCase()) || 
                        p.location.toLowerCase().includes(propertySearchTerm.toLowerCase())
                      )
                      .map(property => (
                      <label
                        key={property._id}
                        className="flex items-start p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <input
                          type="checkbox"
                          value={property._id}
                          checked={formData.interestedProperties.includes(property._id)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              interestedProperties: e.target.checked
                                ? [...prev.interestedProperties, value]
                                : prev.interestedProperties.filter(id => id !== value)
                            }));
                          }}
                          className="mt-1 mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{property.name}</div>
                          <div className="text-sm text-gray-600">
                            ৳{property.price?.toLocaleString()} • {property.location}
                          </div>
                          <div className="text-xs text-gray-500">
                            {property.bedrooms} bed • {property.bathrooms} bath • {property.squareFeet} sqft
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">No properties available</div>
                  )}
                </div>
                {formData.interestedProperties.length > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    {formData.interestedProperties.length} propert{formData.interestedProperties.length === 1 ? 'y' : 'ies'} selected
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Handler</label>
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
                          assignedAgent: '' // Reset agent when zone changes
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          assignedAgent: '' // Reset agent when thana changes
                        }));
                      }}
                      disabled={!formData.customerZone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Thana</option>
                      {formData.customerZone && locationData[formData.customerZone] && Object.keys(locationData[formData.customerZone]).map(thana => (
                        <option key={thana} value={thana}>{thana}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <select
                  name="assignedAgent"
                  value={formData.assignedAgent}
                  onChange={handleInputChange}
                  disabled={!formData.customerZone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.customerZone ? 'Select Agent' : 'Select zone first'}
                  </option>
                  {agents
                    .filter(agent => 
                      agent.role === 'agent' && 
                      agent.isActive && 
                      (!formData.customerZone || agent.assignedZone === formData.customerZone) &&
                      (!formData.customerThana || agent.assignedThana === formData.customerThana)
                    )
                    .map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name} ({agent.assignedZone || 'No Zone'}{agent.assignedThana ? ` - ${agent.assignedThana}` : ''})
                      </option>
                    ))}
                  {formData.customerZone && agents.filter(a => 
                    a.role === 'agent' && 
                    a.isActive && 
                    a.assignedZone === formData.customerZone &&
                    (!formData.customerThana || a.assignedThana === formData.customerThana)
                  ).length === 0 && (
                    <option disabled>No active agents in this {formData.customerThana ? 'thana' : 'zone'}</option>
                  )}
                </select>
                {formData.customerZone && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing agents in: {formData.customerZone}{formData.customerThana ? ` - ${formData.customerThana}` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  name="nextFollowUpDate"
                  value={formData.nextFollowUpDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {showEditModal ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Customer Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-gray-900">{selectedCustomer.name}</p>
                  </div>
                  {/* <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{selectedCustomer.email}</p>
                  </div> */}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                    <p className="text-gray-900">{selectedCustomer.phone}</p>
                  </div>
                  {selectedCustomer.address && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Note:</span>
                      <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedCustomer.address}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Priority:</span>
                    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getPriorityColor(selectedCustomer.priority)}`}>
                      {selectedCustomer.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned Agent:</span>
                    <p className="text-gray-900">{selectedCustomer.assignedAgent?.name || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              {/* Budget & Preferences */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Budget Range:</span>
                    <p className="text-gray-900">
                      ৳{selectedCustomer.budget?.min?.toLocaleString()} - ৳{selectedCustomer.budget?.max?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Preferred Locations:</span>
                    <p className="text-gray-900">
                      {selectedCustomer.preferredLocation?.join(', ') || 'Not specified'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-500">Property Types:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedCustomer.propertyType?.map(type => (
                        <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interested Properties */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Interested Properties</h3>
                {selectedCustomer.interestedProperties?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedCustomer.interestedProperties.map(property => (
                      <div key={property._id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{property.name}</p>
                          <p className="text-sm text-gray-600">{property.location}</p>
                        </div>
                        <p className="text-lg font-semibold text-blue-600">
                          ৳{property.price?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No properties assigned yet</p>
                )}
              </div>

              {/* Notes/Chat Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Communication Log</h3>
                  <span className="text-sm text-gray-500">
                    {selectedCustomer.notes?.length || 0} {selectedCustomer.notes?.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Add Note Input - Moved to top for better UX */}
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex justify-between items-center text-sm font-medium text-gray-700 mb-2">
                      <span>📝 Add New Communication Entry</span>
                      <span className="text-xs text-gray-500 font-normal">Posting as: <span className="font-medium text-blue-600">{user?.name}</span></span>
                    </label>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Record a call, meeting, email, or any customer interaction..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleAddNote();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">Press Ctrl+Enter to send</span>
                      <button
                        onClick={handleAddNote}
                        disabled={!noteText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Entry
                      </button>
                    </div>
                  </div>
                </div>

                {/* Communication Timeline */}
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {selectedCustomer.notes?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCustomer.notes
                        .slice()
                        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                        .map((note, index) => {
                          const noteDate = new Date(note.addedAt);
                          const isToday = noteDate.toDateString() === new Date().toDateString();
                          const isYesterday = new Date(noteDate.getTime() + 86400000).toDateString() === new Date().toDateString();
                          
                          let dateLabel = noteDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
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
                              {/* Timeline line */}
                              {index < selectedCustomer.notes.length - 1 && (
                                <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-blue-200"></div>
                              )}
                              
                              {/* Note Card */}
                              <div className="flex gap-3">
                                {/* Avatar/Icon */}
                                <div className="shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm z-10">
                                  {authorName.charAt(0).toUpperCase()}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="p-3">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {authorName}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <span>{dateLabel}</span>
                                          <span>•</span>
                                          <span>{noteDate.toLocaleTimeString('en-US', { 
                                            hour: 'numeric', 
                                            minute: '2-digit', 
                                            hour12: true 
                                          })}</span>
                                        </div>
                                      </div>
                                      {index === 0 && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                          Latest
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Message */}
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                      {note.note}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-500 font-medium">No communication history yet</p>
                      <p className="text-gray-400 text-sm mt-1">Start by adding your first interaction note above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
