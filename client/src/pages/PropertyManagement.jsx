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
  TableCellsIcon,
  Squares2X2Icon,
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
  const [propertyCodeSearch, setPropertyCodeSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSubType, setFilterSubType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [filterThana, setFilterThana] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  const [formData, setFormData] = useState({
    title: '',
    name: '',
    type: 'apartment',
    purpose: 'sale',
    price: '',
    size: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    privateNote: '',
    features: [],
    location: { zone: '', thana: '', area: '', address: '' },
    images: [],
    status: 'available',
    assignedAgent: ''
  });

  useEffect(() => {
    fetchProperties();
    if (user?.role !== 'agent') fetchAgents();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, propertyCodeSearch, filterType, filterSubType, filterStatus, minPrice, maxPrice, filterZone, filterThana, filterArea]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getAll({ page: 1, limit: 500 });
      const data = response.data;
      setProperties(Array.isArray(data) ? data : data?.properties || []);
    } catch (error) {
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredProperties = properties.filter(property => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      property.name?.toLowerCase().includes(searchLower) ||
      property.title?.toLowerCase().includes(searchLower) ||
      property.location?.toLowerCase().includes(searchLower) ||
      property.description?.toLowerCase().includes(searchLower);

    const matchesPropertyCode = !propertyCodeSearch || 
      property.propertyCode?.toLowerCase().includes(propertyCodeSearch.toLowerCase());

    const matchesType = filterType === 'all' || property.type?.toLowerCase() === filterType.toLowerCase();
    const matchesSubType = filterSubType === 'all' || property.subType === filterSubType;
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;

    const matchesMinPrice = !minPrice || property.price >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || property.price <= Number(maxPrice);

    const matchesZone = filterZone === 'all' || property.zone === filterZone;
    const matchesThana = filterThana === 'all' || property.thana === filterThana;
    const matchesArea = filterArea === 'all' || property.area === filterArea;

    return matchesSearch && matchesPropertyCode && matchesType && matchesSubType && matchesStatus && matchesMinPrice && matchesMaxPrice && matchesZone && matchesThana && matchesArea;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

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
      
      // Add name field (required by backend)
      submitData.append('name', formData.title);
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('purpose', formData.purpose);
      submitData.append('state', formData.purpose); // Map purpose to state
      submitData.append('price', formData.price);
      submitData.append('size', formData.size);
      submitData.append('squareFeet', formData.size); // Map size to squareFeet
      submitData.append('bedrooms', formData.bedrooms);
      submitData.append('bathrooms', formData.bathrooms);
      submitData.append('description', formData.description);
      submitData.append('privateNote', formData.privateNote);
      submitData.append('status', formData.status);
      submitData.append('assignedAgent', formData.assignedAgent);
      
      // Add location as JSON string
      submitData.append('location', JSON.stringify(formData.location));
      
      // Add features as JSON string
      submitData.append('features', JSON.stringify(formData.features));
      
      // Add images
      formData.images.forEach(img => {
        if (img instanceof File) {
          submitData.append('images', img);
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
      
      // Add name field (required by backend)
      submitData.append('name', formData.title);
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('purpose', formData.purpose);
      submitData.append('state', formData.purpose); // Map purpose to state
      submitData.append('price', formData.price);
      submitData.append('size', formData.size);
      submitData.append('squareFeet', formData.size); // Map size to squareFeet
      submitData.append('bedrooms', formData.bedrooms);
      submitData.append('bathrooms', formData.bathrooms);
      submitData.append('description', formData.description);
      submitData.append('privateNote', formData.privateNote);
      submitData.append('status', formData.status);
      submitData.append('assignedAgent', formData.assignedAgent);
      
      // Add location as JSON string
      submitData.append('location', JSON.stringify(formData.location));
      
      // Add features as JSON string
      submitData.append('features', JSON.stringify(formData.features));
      
      // Add new images only
      formData.images.forEach(img => {
        if (img instanceof File) {
          submitData.append('images', img);
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
      name: '',
      type: 'apartment',
      purpose: 'sale',
      price: '',
      size: '',
      bedrooms: '',
      bathrooms: '',
      description: '',
      privateNote: '',
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
      title: property.title || property.name || '',
      type: property.type || 'apartment',
      purpose: property.purpose || property.state || 'sale',
      price: property.price || '',
      size: property.size || property.squareFeet || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      description: property.description || '',
      privateNote: property.privateNote || '',
      features: property.features || [],
      location: {
        zone: property.zone || '',
        thana: property.thana || '',
        area: property.area || '',
        address: property.address || ''
      },
      images: property.images || [],
      status: property.status || 'available',
      assignedAgent: property.assignedAgent?._id || ''
    });
    setShowEditModal(true);
  };

  const propertyTypes = ['Apartment', 'House', 'Duplex', 'Land', 'Commercial'];
  const statusOptions = ['available', 'sold', 'rented', 'pending'];

  const getSubTypes = (type) => {
    switch(type) {
      case 'Apartment':
        return ['Brand New Flat', 'Used Flat', 'Flat with Bank Loan', 'Flat with Gas', 'Upcoming Flat', 'Luxury Flat'];
      case 'House':
        return ['Ready Made', 'Home with Gas'];
      case 'Land':
        return ['Ready Plot', 'Developing Plot', 'Project Plot'];
      case 'Commercial':
        return ['Shop', 'Office', 'Industrial'];
      default:
        return [];
    }
  };

  const hasActiveFilters = searchTerm || propertyCodeSearch || filterType !== 'all' || filterSubType !== 'all' || filterStatus !== 'all' || minPrice || maxPrice || filterZone !== 'all' || filterThana !== 'all' || filterArea !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setPropertyCodeSearch('');
    setFilterType('all');
    setFilterSubType('all');
    setFilterStatus('all');
    setMinPrice('');
    setMaxPrice('');
    setFilterZone('all');
    setFilterThana('all');
    setFilterArea('all');
  };

  return (
    <DashboardLayout title="Properties" subtitle="Manage all property listings">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2.5 transition-colors ${viewMode === 'card' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Card View"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Table View"
            >
              <TableCellsIcon className="w-5 h-5" />
            </button>
          </div>
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

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        {/* Row 1: Search and Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>

          {/* Property Code Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Property Code"
              value={propertyCodeSearch}
              onChange={(e) => setPropertyCodeSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 font-mono text-sm"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setFilterSubType('all'); }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
          >
            <option value="all">All Types</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* SubType Filter */}
          <select
            value={filterSubType}
            onChange={(e) => setFilterSubType(e.target.value)}
            disabled={filterType === 'all'}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="all">All SubTypes</option>
            {filterType !== 'all' && getSubTypes(filterType).map(subType => (
              <option key={subType} value={subType}>{subType}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
          >
            <option value="all">All Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status} className="capitalize">{status}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Price and Location Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
          {/* Min Price */}
          <div className="relative">
            <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>

          {/* Max Price */}
          <div className="relative">
            <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            />
          </div>

          {/* Zone Filter */}
          <select
            value={filterZone}
            onChange={(e) => { setFilterZone(e.target.value); setFilterThana('all'); setFilterArea('all'); }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
          >
            <option value="all">All Zones</option>
            {getZones().map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>

          {/* Thana Filter */}
          <select
            value={filterThana}
            onChange={(e) => { setFilterThana(e.target.value); setFilterArea('all'); }}
            disabled={filterZone === 'all'}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="all">All Thanas</option>
            {filterZone !== 'all' && getThanasByZone(filterZone).map(thana => (
              <option key={thana} value={thana}>{thana}</option>
            ))}
          </select>

          {/* Area Filter */}
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            disabled={filterThana === 'all'}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="all">All Areas</option>
            {filterThana !== 'all' && getAreasByThana(filterZone, filterThana).map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-purple-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {propertyCodeSearch && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                Code: "{propertyCodeSearch}"
                <button onClick={() => setPropertyCodeSearch('')} className="hover:text-gray-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Type: {filterType}
                <button onClick={() => { setFilterType('all'); setFilterSubType('all'); }} className="hover:text-blue-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filterSubType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                SubType: {filterSubType}
                <button onClick={() => setFilterSubType('all')} className="hover:text-indigo-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:text-green-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {minPrice && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                Min: ৳{Number(minPrice).toLocaleString()}
                <button onClick={() => setMinPrice('')} className="hover:text-orange-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                Max: ৳{Number(maxPrice).toLocaleString()}
                <button onClick={() => setMaxPrice('')} className="hover:text-red-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filterZone !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                Zone: {filterZone}
                <button onClick={() => { setFilterZone('all'); setFilterThana('all'); setFilterArea('all'); }} className="hover:text-teal-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filterThana !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                Thana: {filterThana}
                <button onClick={() => { setFilterThana('all'); setFilterArea('all'); }} className="hover:text-cyan-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filterArea !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-medium">
                Area: {filterArea}
                <button onClick={() => setFilterArea('all')} className="hover:text-sky-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Results Count and Items Per Page */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredProperties.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredProperties.length)}</span> of <span className="font-semibold">{filteredProperties.length}</span> properties
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>
      </div>

      {/* Properties Grid/Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BuildingOfficeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No properties found</h3>
          <p className="text-gray-500">
            {properties.length === 0 
              ? 'Add your first property to get started.'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProperties.map((property) => (
                <div key={property._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group p-5">
                  {/* Header with Code and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
                      {property.propertyCode}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.status === 'available' ? 'bg-green-100 text-green-700' :
                        property.status === 'sold' ? 'bg-red-100 text-red-700' :
                        property.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {property.status}
                      </span>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium capitalize">
                        {property.purpose || property.state}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-1">{property.title || property.name}</h3>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-gray-500 mb-3">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="text-sm truncate">
                      {property.zone ? `${property.area || ''}, ${property.thana || ''}`.trim().replace(/^,\s*|,\s*$/g, '') : property.location}
                    </span>
                  </div>

                  {/* Property Details */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-100 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{property.size || property.squareFeet || '-'}</p>
                      <p className="text-xs text-gray-500">Sq.Ft</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{property.bedrooms || '-'}</p>
                      <p className="text-xs text-gray-500">Beds</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{property.bathrooms || '-'}</p>
                      <p className="text-xs text-gray-500">Baths</p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <HomeModernIcon className="w-4 h-4" />
                    <span className="capitalize">{property.type}</span>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-800 to-indigo-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Beds</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Purpose</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedProperties.map((property, index) => (
                      <tr key={property._id} className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {property.propertyCode || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-gray-900 max-w-[180px] truncate" title={property.title || property.name}>
                            {property.title || property.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-gray-600 max-w-[150px]">
                            <MapPinIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate" title={property.zone ? `${property.area || ''}, ${property.thana || ''}` : property.location}>
                              {property.zone ? `${property.area || ''}, ${property.thana || ''}`.trim().replace(/^,\s*|,\s*$/g, '') : property.location}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-700 capitalize">{property.type}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-bold text-purple-600">৳{property.price?.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{property.size || property.squareFeet} sqft</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{property.bedrooms || '-'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            property.status === 'available' ? 'bg-green-100 text-green-700' :
                            property.status === 'sold' ? 'bg-red-100 text-red-700' :
                            property.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {property.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                            {property.purpose || property.state}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setSelectedProperty(property); setShowViewModal(true); }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {user?.role !== 'agent' && (
                              <>
                                <button
                                  onClick={() => openEditModal(property)}
                                  className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(property._id)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <TrashIcon className="w-4 h-4" />
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Private Note (Confidential - Not visible to customers)
                        </label>
                        <textarea
                          rows={3}
                          value={formData.privateNote || ''}
                          onChange={(e) => setFormData({...formData, privateNote: e.target.value})}
                          className="w-full px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 resize-none"
                          placeholder="Internal notes about this property (only visible to staff)"
                        />
                        <p className="text-xs text-yellow-600 mt-1">
                          ⚠️ This note is for internal use only and will not be visible to customers
                        </p>
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
                      {/* Header */}
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 relative">
                        <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm font-mono">
                            {selectedProperty.propertyCode}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedProperty.status === 'available' ? 'bg-green-400 text-green-900' :
                            selectedProperty.status === 'sold' ? 'bg-red-400 text-red-900' :
                            selectedProperty.status === 'rented' ? 'bg-blue-400 text-blue-900' :
                            'bg-yellow-400 text-yellow-900'
                          }`}>
                            {selectedProperty.status}
                          </span>
                          <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium capitalize">
                            For {selectedProperty.purpose || selectedProperty.state}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{selectedProperty.title || selectedProperty.name}</h2>
                        <div className="flex items-center gap-2 text-white/80 mt-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span className="text-sm">
                            {selectedProperty.zone ? `${selectedProperty.area || ''}, ${selectedProperty.thana || ''}, ${selectedProperty.zone}`.trim().replace(/^,\s*|,\s*$/g, '') : selectedProperty.location}
                          </span>
                        </div>
                        {selectedProperty.address && (
                          <p className="text-sm text-white/70 mt-1 ml-6">{selectedProperty.address}</p>
                        )}
                      </div>

                      <div className="p-6 space-y-6">
                        {/* Price */}
                        <div className="text-center py-4 bg-purple-50 rounded-xl">
                          <p className="text-sm text-gray-500 mb-1">Price</p>
                          <span className="text-3xl font-bold text-purple-600">৳{selectedProperty.price?.toLocaleString()}</span>
                        </div>

                        {/* Key Stats */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-semibold text-gray-900">{selectedProperty.size || selectedProperty.squareFeet || '-'}</p>
                            <p className="text-sm text-gray-500">Sq. Ft.</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-semibold text-gray-900">{selectedProperty.bedrooms || '-'}</p>
                            <p className="text-sm text-gray-500">Beds</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-semibold text-gray-900">{selectedProperty.bathrooms || '-'}</p>
                            <p className="text-sm text-gray-500">Baths</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-semibold text-gray-900 capitalize">{selectedProperty.type}</p>
                            <p className="text-sm text-gray-500">Type</p>
                          </div>
                        </div>

                        {/* Description */}
                        {selectedProperty.description && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">{selectedProperty.description}</p>
                          </div>
                        )}

                        {/* Features */}
                        {selectedProperty.features && selectedProperty.features.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Features & Amenities</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedProperty.features.map((feature, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assigned Agent */}
                        {selectedProperty.assignedAgent && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Assigned Agent</h3>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {selectedProperty.assignedAgent.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{selectedProperty.assignedAgent.name}</p>
                                <p className="text-sm text-gray-500">{selectedProperty.assignedAgent.email}</p>
                                {selectedProperty.assignedAgent.phone && (
                                  <p className="text-sm text-gray-500">{selectedProperty.assignedAgent.phone}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Private Note (Staff Only) */}
                        {selectedProperty.privateNote && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                              <span className="text-yellow-600 font-semibold">🔒</span>
                              <div className="flex-1">
                                <h3 className="font-semibold text-yellow-800 mb-1">Private Note (Internal Only)</h3>
                                <p className="text-gray-700 text-sm leading-relaxed">{selectedProperty.privateNote}</p>
                              </div>
                            </div>
                          </div>
                        )}
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
