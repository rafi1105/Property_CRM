import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminNavbar from '../components/AdminNavbar';
import { agentAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AgentManagement = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    licenseNumber: '',
    specialization: [],
    experience: 0,
    bio: '',
    commissionRate: 0,
    availability: 'available',
    workingHours: { start: '09:00', end: '18:00' }
  });

  useEffect(() => {
    fetchAgents();
    fetchUsers();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await agentAPI.getAll({ page: 1, limit: 100 });
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      console.log('All users:', response.data.users); // Debug log
      // Filter to show only users with agent role who don't have agent profile yet
      const allUsers = response.data.users || [];
      const existingAgentUserIds = agents.map(a => a.userId?._id || a.userId);
      const agentUsers = allUsers.filter(u => 
        u.role === 'agent' && !existingAgentUserIds.includes(u._id)
      );
      console.log('Filtered agent users:', agentUsers); // Debug log
      setUsers(agentUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('workingHours.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        workingHours: { ...prev.workingHours, [field]: value }
      }));
    } else if (name === 'specialization') {
      setFormData(prev => {
        const specs = prev.specialization || [];
        if (checked) {
          return { ...prev, specialization: [...specs, value] };
        } else {
          return { ...prev, specialization: specs.filter(s => s !== value) };
        }
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const agentData = {
        ...formData,
        experience: Number(formData.experience),
        commissionRate: Number(formData.commissionRate)
      };

      if (showEditModal && selectedAgent) {
        await agentAPI.update(selectedAgent._id, agentData);
        toast.success('Agent updated successfully');
      } else {
        await agentAPI.create(agentData);
        toast.success('Agent created successfully');
      }

      resetForm();
      fetchAgents();
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error(error.response?.data?.message || 'Failed to save agent');
    }
  };

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setFormData({
      userId: agent.userId?._id || agent.userId,
      licenseNumber: agent.licenseNumber || '',
      specialization: agent.specialization || [],
      experience: agent.experience || 0,
      bio: agent.bio || '',
      commissionRate: agent.commissionRate || 0,
      availability: agent.availability || 'available',
      workingHours: agent.workingHours || { start: '09:00', end: '18:00' }
    });
    setShowEditModal(true);
  };

  const handleViewDetails = async (agent) => {
    try {
      const response = await agentAPI.getById(agent._id);
      setSelectedAgent(response.data.agent);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching agent details:', error);
      toast.error('Failed to load agent details');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete agent "${name}"?`)) return;
    
    try {
      await agentAPI.delete(id);
      toast.success('Agent deleted successfully');
      fetchAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      licenseNumber: '',
      specialization: [],
      experience: 0,
      bio: '',
      commissionRate: 0,
      availability: 'available',
      workingHours: { start: '09:00', end: '18:00' }
    });
    setSelectedAgent(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const getAvailabilityColor = (availability) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      unavailable: 'bg-red-100 text-red-800'
    };
    return colors[availability] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Agent Management</h1>
            <p className="text-gray-600 mt-1">Manage agent profiles and activities</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Agent</span>
          </button>
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No agents found. Add your first agent to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Agent Header */}
                  <div className="flex items-center mb-4">
                    <div className="shrink-0 h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl font-semibold">
                        {agent.userId?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{agent.userId?.name}</h3>
                      <p className="text-sm text-gray-500">{agent.userId?.email}</p>
                    </div>
                  </div>

                  {/* Agent Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{agent.experience} years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-medium">{agent.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Properties:</span>
                      <span className="font-medium">{agent.assignedProperties?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Customers:</span>
                      <span className="font-medium">{agent.assignedCustomers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Closed Deals:</span>
                      <span className="font-medium">{agent.closedDeals || 0}</span>
                    </div>
                  </div>

                  {/* Specializations */}
                  {agent.specialization?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {agent.specialization.map(spec => (
                          <span key={spec} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  <div className="mb-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAvailabilityColor(agent.availability)}`}>
                      {agent.availability.toUpperCase()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(agent)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleEdit(agent)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(agent._id, agent.userId?.name)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {showEditModal ? 'Edit Agent' : 'Add New Agent'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {!showEditModal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select User (Agent Role) *</label>
                  <select
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a user...</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                <div className="grid grid-cols-3 gap-2">
                  {['residential', 'commercial', 'land', 'luxury', 'rental'].map(spec => (
                    <label key={spec} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="specialization"
                        value={spec}
                        checked={formData.specialization.includes(spec)}
                        onChange={handleInputChange}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm capitalize">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Time</label>
                  <input
                    type="time"
                    name="workingHours.start"
                    value={formData.workingHours.start}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work End Time</label>
                  <input
                    type="time"
                    name="workingHours.end"
                    value={formData.workingHours.end}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
                  {showEditModal ? 'Update Agent' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Agent Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Agent Profile */}
              <div className="flex items-center mb-6">
                <div className="shrink-0 h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-semibold">
                    {selectedAgent.userId?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-6">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedAgent.userId?.name}</h3>
                  <p className="text-gray-600">{selectedAgent.userId?.email}</p>
                  <p className="text-gray-600">{selectedAgent.userId?.phone}</p>
                </div>
              </div>

              {/* Professional Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">License Number</h4>
                  <p className="text-gray-900">{selectedAgent.licenseNumber || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Experience</h4>
                  <p className="text-gray-900">{selectedAgent.experience} years</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Commission Rate</h4>
                  <p className="text-gray-900">{selectedAgent.commissionRate}%</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Availability</h4>
                  <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getAvailabilityColor(selectedAgent.availability)}`}>
                    {selectedAgent.availability.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Bio */}
              {selectedAgent.bio && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Biography</h4>
                  <p className="text-gray-900">{selectedAgent.bio}</p>
                </div>
              )}

              {/* Specializations */}
              {selectedAgent.specialization?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.specialization.map(spec => (
                      <span key={spec} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full capitalize">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-blue-600">৳{selectedAgent.totalSales?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Commission</p>
                    <p className="text-2xl font-bold text-green-600">৳{selectedAgent.totalCommission?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Closed Deals</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedAgent.closedDeals || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Active Deals</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedAgent.activeDeals || 0}</p>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Working Hours</h4>
                <p className="text-gray-900">
                  {selectedAgent.workingHours?.start || '09:00'} - {selectedAgent.workingHours?.end || '18:00'}
                </p>
              </div>

              {/* Assignments */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned Properties</h4>
                  <p className="text-3xl font-bold text-gray-900">{selectedAgent.assignedProperties?.length || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned Customers</h4>
                  <p className="text-3xl font-bold text-gray-900">{selectedAgent.assignedCustomers?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagement;
