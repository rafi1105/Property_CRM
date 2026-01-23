import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyAPI, agentAPI } from '../utils/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  BuildingOfficeIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { locationData } from '../data/locations';

// Helper functions to work with location data
const getZones = () => Object.keys(locationData);
const getThanasByZone = (zone) => zone ? Object.keys(locationData[zone] || {}) : [];
const getAreasByThana = (zone, thana) => (zone && thana) ? (locationData[zone]?.[thana] || []) : [];

const PropertyManagement = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: '',
    type: 'apartment',
    purpose: 'sale',
    price: '',
    size: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    features: [],
    location: { zone: '', thana: '', area: '', address: '' },
    images: [],
    status: 'available',
    assignedAgent: ''
  });

  useEffect(() => {
    fetchProperties();
    if (user?.role !== 'agent') fetchAgents();
  }, [currentPage, filterType, filterStatus, searchTerm]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: itemsPerPage };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const response = await propertyAPI.getAll(params);
      const data = response.data;
      setProperties(Array.isArray(data) ? data : data?.properties || []);
      setTotalPages(data?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await agentAPI.getAll();
      setAgents(response.data?.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'location' || key === 'features') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'images') {
          formData.images.forEach(img => submitData.append('images', img));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      await propertyAPI.create(submitData);
      toast.success('Property created successfully!');
      setShowAddModal(false);
      resetForm();
      fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create property');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'location' || key === 'features') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'images') {
          formData.images.forEach(img => {
            if (img instanceof File) submitData.append('images', img);
          });
        } else {
          submitData.append(key, formData[key]);
        }
      });

      await propertyAPI.update(selectedProperty._id, submitData);
      toast.success('Property updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update property');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyAPI.delete(id);
        toast.success('Property deleted successfully!');
        fetchProperties();
      } catch (error) {
        toast.error('Failed to delete property');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'apartment',
      purpose: 'sale',
      price: '',
      size: '',
      bedrooms: '',
      bathrooms: '',
      description: '',
      features: [],
      location: { zone: '', thana: '', area: '', address: '' },
      images: [],
      status: 'available',
      assignedAgent: ''
    });
    setSelectedProperty(null);
  };

  const openEditModal = (property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title || '',
      type: property.type || 'apartment',
      purpose: property.purpose || 'sale',
      price: property.price || '',
      size: property.size || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      description: property.description || '',
      features: property.features || [],
      location: property.location || { zone: '', thana: '', area: '', address: '' },
      images: property.images || [],
      status: property.status || 'available',
      assignedAgent: property.assignedAgent?._id || ''
    });
    setShowEditModal(true);
  };

  const propertyTypes = ['apartment', 'house', 'villa', 'land', 'commercial', 'office'];
  const statusOptions = ['available', 'sold', 'rented', 'pending'];

  return (
    <DashboardLayout title="Properties" subtitle="Manage all property listings">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 w-64"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
          >
            <option value="all">All Types</option>
            {propertyTypes.map(type => (
              <option key={type} value={type} className="capitalize">{type}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
          >
            <option value="all">All Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status} className="capitalize">{status}</option>
            ))}
          </select>
        </div>

        {user?.role !== 'agent' && (
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            Add Property
          </button>
        )}
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                {/* Property Image */}
                <div className="relative h-48 bg-gray-100">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BuildingOfficeIcon className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      property.status === 'available' ? 'bg-green-500 text-white' :
                      property.status === 'sold' ? 'bg-red-500 text-white' :
                      property.status === 'rented' ? 'bg-blue-500 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium capitalize">
                      {property.purpose}
                    </span>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">{property.title}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {property.propertyCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-500 mb-3">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="text-sm truncate">{property.location?.area}, {property.location?.district}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <HomeModernIcon className="w-4 h-4" />
                      {property.type}
                    </span>
                    <span>{property.size} sqft</span>
                    {property.bedrooms && <span>{property.bedrooms} Beds</span>}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xl font-bold text-purple-600">
                      ৳{property.price?.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedProperty(property); setShowViewModal(true); }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {user?.role !== 'agent' && (
                        <>
                          <button
                            onClick={() => openEditModal(property)}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(property._id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === i + 1
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
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
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">
                      {showEditModal ? 'Edit Property' : 'Add New Property'}
                    </Dialog.Title>
                    <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={showEditModal ? handleUpdate : handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Property title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          {propertyTypes.map(type => (
                            <option key={type} value={type} className="capitalize">{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                        <select
                          value={formData.purpose}
                          onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="sale">For Sale</option>
                          <option value="rent">For Rent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price (৳)</label>
                        <input
                          type="number"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Enter price"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Size (sqft)</label>
                        <input
                          type="number"
                          required
                          value={formData.size}
                          onChange={(e) => setFormData({...formData, size: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Enter size"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                        <input
                          type="number"
                          value={formData.bedrooms}
                          onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Number of bedrooms"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                        <input
                          type="number"
                          value={formData.bathrooms}
                          onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Number of bathrooms"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                        <select
                          value={formData.location.zone}
                          onChange={(e) => setFormData({...formData, location: {...formData.location, zone: e.target.value, thana: '', area: ''}})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="">Select Zone</option>
                          {getZones().map(zone => (
                            <option key={zone} value={zone}>{zone}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thana</label>
                        <select
                          value={formData.location.thana}
                          onChange={(e) => setFormData({...formData, location: {...formData.location, thana: e.target.value, area: ''}})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          disabled={!formData.location.zone}
                        >
                          <option value="">Select Thana</option>
                          {formData.location.zone && getThanasByZone(formData.location.zone).map(thana => (
                            <option key={thana} value={thana}>{thana}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                        <select
                          value={formData.location.area}
                          onChange={(e) => setFormData({...formData, location: {...formData.location, area: e.target.value}})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          disabled={!formData.location.thana}
                        >
                          <option value="">Select Area</option>
                          {formData.location.thana && getAreasByThana(formData.location.zone, formData.location.thana).map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status} className="capitalize">{status}</option>
                          ))}
                        </select>
                      </div>

                      {user?.role !== 'agent' && agents.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Assign Agent</label>
                          <select
                            value={formData.assignedAgent}
                            onChange={(e) => setFormData({...formData, assignedAgent: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          >
                            <option value="">Select Agent</option>
                            {agents.map(agent => (
                              <option key={agent._id} value={agent._id}>{agent.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={formData.location.address}
                          onChange={(e) => setFormData({...formData, location: {...formData.location, address: e.target.value}})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Full address"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          rows={4}
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
                          placeholder="Property description"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                          <PhotoIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setFormData({...formData, images: [...formData.images, ...Array.from(e.target.files)]})}
                            className="hidden"
                            id="images"
                          />
                          <label htmlFor="images" className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium">
                            Click to upload images
                          </label>
                          <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
                        </div>
                        {formData.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {formData.images.map((img, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={img instanceof File ? URL.createObjectURL(img) : img}
                                  alt=""
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium">
                        {showEditModal ? 'Update Property' : 'Create Property'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* View Modal */}
      <Transition appear show={showViewModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowViewModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
                  {selectedProperty && (
                    <>
                      <div className="h-64 bg-gray-100 relative">
                        {selectedProperty.images?.[0] ? (
                          <img src={selectedProperty.images[0]} alt={selectedProperty.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BuildingOfficeIcon className="w-20 h-20 text-gray-300" />
                          </div>
                        )}
                        <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-xl hover:bg-white">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedProperty.title}</h2>
                            <p className="text-gray-500 flex items-center gap-1 mt-1">
                              <MapPinIcon className="w-4 h-4" />
                              {selectedProperty.location?.address || `${selectedProperty.location?.area}, ${selectedProperty.location?.district}`}
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-purple-600">৳{selectedProperty.price?.toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-100">
                          <div className="text-center">
                            <p className="text-2xl font-semibold text-gray-900">{selectedProperty.size}</p>
                            <p className="text-sm text-gray-500">Sq. Ft.</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-semibold text-gray-900">{selectedProperty.bedrooms || '-'}</p>
                            <p className="text-sm text-gray-500">Beds</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-semibold text-gray-900">{selectedProperty.bathrooms || '-'}</p>
                            <p className="text-sm text-gray-500">Baths</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-semibold text-gray-900 capitalize">{selectedProperty.type}</p>
                            <p className="text-sm text-gray-500">Type</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                          <p className="text-gray-600">{selectedProperty.description || 'No description available.'}</p>
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
    </DashboardLayout>
  );
};

export default PropertyManagement;
