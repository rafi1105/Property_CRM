import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { agentAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

const AgentManagement = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    licenseNumber: '',
    specialization: [],
    experience: 0,
    bio: '',
    commissionRate: 0,
    availability: 'available',
  });

  const specializations = ['Residential', 'Commercial', 'Industrial', 'Land', 'Luxury', 'Rental'];

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
      const allUsers = response.data.users || [];
      const agentUsers = allUsers.filter(u => u.role === 'agent');
      setUsers(agentUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await agentAPI.create(formData);
      toast.success('Agent profile created!');
      setShowAddModal(false);
      resetForm();
      fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create agent');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await agentAPI.update(selectedAgent._id, formData);
      toast.success('Agent updated!');
      setShowEditModal(false);
      resetForm();
      fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update agent');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this agent profile?')) {
      try {
        await agentAPI.delete(id);
        toast.success('Agent deleted!');
        fetchAgents();
      } catch (error) {
        toast.error('Failed to delete agent');
      }
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
    });
    setSelectedAgent(null);
  };

  const openEditModal = (agent) => {
    setSelectedAgent(agent);
    setFormData({
      userId: agent.user?._id || '',
      licenseNumber: agent.licenseNumber || '',
      specialization: agent.specialization || [],
      experience: agent.experience || 0,
      bio: agent.bio || '',
      commissionRate: agent.commissionRate || 0,
      availability: agent.availability || 'available',
    });
    setShowEditModal(true);
  };

  const toggleSpecialization = (spec) => {
    if (formData.specialization.includes(spec)) {
      setFormData({ ...formData, specialization: formData.specialization.filter(s => s !== spec) });
    } else {
      setFormData({ ...formData, specialization: [...formData.specialization, spec] });
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availabilityColors = {
    available: 'bg-green-100 text-green-700',
    busy: 'bg-yellow-100 text-yellow-700',
    unavailable: 'bg-red-100 text-red-700'
  };

  return (
    <DashboardLayout title="Agents" subtitle="Manage your sales agents">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 w-64"
          />
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Add Agent
        </button>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <div key={agent._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">
                    {agent.user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{agent.user?.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{agent.user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${availabilityColors[agent.availability]}`}>
                    {agent.availability}
                  </span>
                  <span className="text-sm text-gray-500">
                    <BriefcaseIcon className="w-4 h-4 inline mr-1" />
                    {agent.experience || 0} years
                  </span>
                </div>

                {agent.specialization?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {agent.specialization.slice(0, 3).map((spec) => (
                      <span key={spec} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-lg">
                        {spec}
                      </span>
                    ))}
                    {agent.specialization.length > 3 && (
                      <span className="text-xs text-gray-500">+{agent.specialization.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-sm mb-4 py-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-lg font-bold text-gray-900">{agent.stats?.totalProperties || 0}</p>
                  <p className="text-xs text-gray-500">Properties</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{agent.stats?.totalCustomers || 0}</p>
                  <p className="text-xs text-gray-500">Customers</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setSelectedAgent(agent); setShowDetailsModal(true); }}
                  className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 font-medium text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => openEditModal(agent)}
                  className="flex-1 py-2 text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 font-medium text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(agent._id)}
                  className="flex-1 py-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredAgents.length === 0 && (
            <div className="col-span-full text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No agents found</h3>
              <p className="text-gray-500 mt-1">Add your first agent to get started</p>
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
                      {showEditModal ? 'Edit Agent' : 'Add New Agent'}
                    </Dialog.Title>
                    <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={showEditModal ? handleUpdate : handleSubmit} className="p-6 space-y-4">
                    {!showEditModal && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                        <select
                          required
                          value={formData.userId}
                          onChange={(e) => setFormData({...formData, userId: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="">Select an agent user</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                        <input
                          type="text"
                          value={formData.licenseNumber}
                          onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.commissionRate}
                          onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                        <select
                          value={formData.availability}
                          onChange={(e) => setFormData({...formData, availability: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="available">Available</option>
                          <option value="busy">Busy</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                      <div className="flex flex-wrap gap-2">
                        {specializations.map((spec) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => toggleSpecialization(spec)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              formData.specialization.includes(spec)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {spec}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
                        placeholder="Agent bio..."
                      />
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

      {/* Details Modal */}
      <Transition appear show={showDetailsModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDetailsModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                  {selectedAgent && (
                    <>
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white font-bold text-3xl">
                            {selectedAgent.user?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white">{selectedAgent.user?.name}</h2>
                        <p className="text-purple-200">{selectedAgent.user?.email}</p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center py-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-2xl font-bold text-purple-600">{selectedAgent.stats?.totalProperties || 0}</p>
                            <p className="text-xs text-gray-500">Properties</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">{selectedAgent.stats?.totalCustomers || 0}</p>
                            <p className="text-xs text-gray-500">Customers</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">{selectedAgent.experience || 0}</p>
                            <p className="text-xs text-gray-500">Years Exp</p>
                          </div>
                        </div>

                        {selectedAgent.bio && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Bio</h4>
                            <p className="text-gray-700">{selectedAgent.bio}</p>
                          </div>
                        )}

                        {selectedAgent.specialization?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Specializations</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedAgent.specialization.map((spec) => (
                                <span key={spec} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-lg">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setShowDetailsModal(false)}
                          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
};

export default AgentManagement;
