import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { locationData } from '../data/locations';
import {
  UserGroupIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TableCellsIcon,
  Squares2X2Icon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [viewMode, setViewMode] = useState('card');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    phone: '',
    isActive: true,
    assignedZone: '',
    assignedThana: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/auth/create-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('User created successfully!');
        setShowAddModal(false);
        resetForm();
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Error creating user');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      const response = await fetch(`${API_BASE_URL}/auth/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('User updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          toast.success('User deleted!');
          fetchUsers();
        }
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'admin', phone: '', isActive: true, assignedZone: '', assignedThana: '' });
    setSelectedUser(null);
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'admin',
      phone: u.phone || '',
      isActive: u.isActive !== false,
      assignedZone: u.assignedZone || '',
      assignedThana: u.assignedThana || ''
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const roleColors = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    agent: 'bg-green-100 text-green-700'
  };

  if (user?.role !== 'super_admin') {
    return (
      <DashboardLayout title="Access Denied">
        <div className="text-center py-12">
          <ShieldCheckIcon className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="text-gray-500">Only Super Admins can access this page</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management" subtitle="Manage system users and roles">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search and Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Card View"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Table View"
              >
                <TableCellsIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Add Button Row */}
        <div className="flex justify-end">
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium text-sm sm:text-base"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-xs sm:text-sm text-gray-500">Total Users</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'super_admin').length}</p>
          <p className="text-xs sm:text-sm text-gray-500">Super Admins</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'admin').length}</p>
          <p className="text-xs sm:text-sm text-gray-500">Admins</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{users.filter(u => u.role === 'agent').length}</p>
          <p className="text-xs sm:text-sm text-gray-500">Agents</p>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {paginatedUsers.map((u) => (
            <div key={u._id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">{u.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{u.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium capitalize ${roleColors[u.role] || roleColors.admin}`}>
                  {u.role?.replace('_', ' ')}
                </span>
                <span className={`flex items-center gap-1 text-xs ${u.isActive !== false ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${u.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  {u.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>

              {u.phone && (
                <div className={`flex items-center gap-2 text-xs sm:text-sm text-gray-500 ${u.role === 'agent' && (u.assignedZone || u.assignedThana) ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
                  <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{u.phone}</span>
                </div>
              )}

              {u.role === 'agent' && (u.assignedZone || u.assignedThana) && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {u.assignedThana ? `${u.assignedThana}${u.assignedZone ? `, ${u.assignedZone}` : ''}` : u.assignedZone}
                  </span>
                </div>
              )}

              {!u.phone && !(u.role === 'agent' && (u.assignedZone || u.assignedThana)) && (
                <div className="mb-3 sm:mb-4"></div>
              )}

              <div className="flex items-center gap-2 pt-3 sm:pt-4 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(u)}
                  className="flex-1 py-2 text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 font-medium text-xs sm:text-sm"
                >
                  Edit
                </button>
                {u.role !== 'super_admin' && user?.role === 'super_admin' && (
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="flex-1 py-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 font-medium text-xs sm:text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {paginatedUsers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-800 to-indigo-600">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">User</th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Phone</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Role</th>
                  <th className="hidden lg:table-cell px-3 sm:px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Location</th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedUsers.map((u, index) => (
                  <tr key={u._id} className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs sm:text-sm">{u.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 text-xs sm:text-sm block truncate max-w-[100px] sm:max-w-none">{u.name}</span>
                          <span className="sm:hidden text-xs text-gray-500 truncate block">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400 hidden md:block" />
                        <span className="truncate max-w-[150px]">{u.email}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-3">
                      <span className="text-xs sm:text-sm text-gray-600">{u.phone || '-'}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium capitalize ${roleColors[u.role] || roleColors.admin}`}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-4 py-3">
                      {u.role === 'agent' && (u.assignedZone || u.assignedThana) ? (
                        <div className="text-xs sm:text-sm">
                          <p className="text-gray-900 font-medium">{u.assignedThana || '-'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{u.assignedZone || '-'}</p>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs ${u.isActive !== false ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${u.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="px-2 sm:px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        {u.role !== 'super_admin' && user?.role === 'super_admin' && (
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="px-2 sm:px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
            <span className="hidden sm:inline">{' '}• Showing {paginatedUsers.length} of {filteredUsers.length} users</span>
          </p>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
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
                <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-900">
                      {showEditModal ? 'Edit User' : 'Add New User'}
                    </Dialog.Title>
                    <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={showEditModal ? handleUpdate : handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password {showEditModal && '(leave blank to keep current)'}
                      </label>
                      <input
                        type="password"
                        required={!showEditModal}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-sm sm:text-base"
                      >
                        {user?.role === 'super_admin' && (
                          <option value="super_admin">Super Admin</option>
                        )}
                        <option value="admin">Admin</option>
                        <option value="agent">Agent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-sm sm:text-base"
                      />
                    </div>

                    {/* Zone and Thana fields for agents */}
                    {formData.role === 'agent' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Zone</label>
                          <select
                            value={formData.assignedZone}
                            onChange={(e) => setFormData({...formData, assignedZone: e.target.value, assignedThana: ''})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-sm sm:text-base"
                          >
                            <option value="">Select Zone</option>
                            {Object.keys(locationData).map(zone => (
                              <option key={zone} value={zone}>{zone}</option>
                            ))}
                          </select>
                        </div>
                        {formData.assignedZone && locationData[formData.assignedZone] && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Thana</label>
                            <select
                              value={formData.assignedThana}
                              onChange={(e) => setFormData({...formData, assignedThana: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-sm sm:text-base"
                            >
                              <option value="">Select Thana</option>
                              {Object.keys(locationData[formData.assignedZone]).map(thana => (
                                <option key={thana} value={thana}>{thana}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <label htmlFor="isActive" className="text-sm text-gray-700">Active User</label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-2.5 sm:py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm sm:text-base">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium text-sm sm:text-base">
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
    </DashboardLayout>
  );
};

export default UserManagement;
