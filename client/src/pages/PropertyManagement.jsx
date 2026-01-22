import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminNavbar from '../components/AdminNavbar';
import { propertyAPI, uploadAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { locationData } from '../data/locations';

const PropertyManagement = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'file'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    propertyCode: '',
    price: '',
    location: '',
    zone: '',
    thana: '',
    area: '',
    type: 'Apartment',
    subType: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    status: 'available',
    description: '',
    features: '',
    images: [],
    imageUrl: '',
    videoUrl: '',
    publishedToFrontend: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyCodeSearch, setPropertyCodeSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSubType, setFilterSubType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterZone, setFilterZone] = useState('all');
  const [filterThana, setFilterThana] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getAll({ page: 1, limit: 500 });
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'zone') {
      setFormData(prev => ({ 
        ...prev, 
        zone: value, 
        thana: '', 
        area: '', 
        location: value 
      }));
    } else if (name === 'thana') {
      setFormData(prev => ({ 
        ...prev, 
        thana: value, 
        area: '', 
        location: `${value}, ${prev.zone}` 
      }));
    } else if (name === 'area') {
      setFormData(prev => ({ 
        ...prev, 
        area: value, 
        location: `${value}, ${prev.thana}, ${prev.zone}` 
      }));
    } else if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value,
        subType: '',
        bedrooms: '',
        bathrooms: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error('Maximum 10 images allowed at once');
      return;
    }
    setSelectedFiles(files);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      selectedFiles.forEach(file => {
        formDataUpload.append('images', file);
      });

      const response = await uploadAPI.uploadImages(formDataUpload);
      const newImages = response.data.images || [];
      
      setUploadedImages(prev => [...prev, ...newImages]);
      setSelectedFiles([]);
      toast.success(`${newImages.length} image(s) uploaded successfully`);
      
      // Clear the file input
      const fileInput = document.getElementById('imageFiles');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded image from the list
  const handleRemoveUploadedImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Combine URL images and uploaded images
      let allImages = [];
      
      if (uploadMethod === 'url') {
        allImages = formData.imageUrl ? formData.imageUrl.split(',').map(url => url.trim()).filter(url => url) : [];
      } else {
        allImages = [...uploadedImages];
      }
      
      // Also include existing images from formData.images if editing
      if (showEditModal && formData.images && formData.images.length > 0) {
        // Filter out any images that might be duplicates
        const existingImages = formData.images.filter(img => !allImages.includes(img));
        if (uploadMethod === 'file') {
          allImages = [...existingImages, ...allImages];
        }
      }

      const propertyData = {
        ...formData,
        price: Number(formData.price),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : 0,
        squareFeet: Number(formData.squareFeet),
        features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(f => f) : [],
        images: allImages
      };
      delete propertyData.imageUrl; // Remove temporary field
      
      // Only include propertyCode if manually entered (let server auto-generate if empty)
      if (!propertyData.propertyCode || propertyData.propertyCode.trim() === '') {
        delete propertyData.propertyCode;
      }

      if (showEditModal && selectedProperty) {
        await propertyAPI.update(selectedProperty._id, propertyData);
        toast.success('Property updated successfully');
      } else {
        await propertyAPI.create(propertyData);
        toast.success('Property created successfully');
      }

      resetForm();
      fetchProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(error.response?.data?.message || 'Failed to save property');
    }
  };

  const handleEdit = (property) => {
    setSelectedProperty(property);
    setFormData({
      name: property.name,
      propertyCode: property.propertyCode || '',
      price: property.price,
      location: property.location,
      zone: property.zone || '',
      thana: property.thana || '',
      area: property.area || '',
      type: property.type,
      subType: property.subType || '',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFeet: property.squareFeet,
      status: property.status,
      description: property.description || '',
      features: Array.isArray(property.features) ? property.features.join(', ') : '',
      images: property.images || [],
      imageUrl: Array.isArray(property.images) ? property.images.join(', ') : '',
      videoUrl: property.videoUrl || '',
      publishedToFrontend: property.publishedToFrontend || false
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await propertyAPI.delete(id);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      propertyCode: '',
      price: '',
      location: '',
      zone: '',
      thana: '',
      area: '',
      type: 'Apartment',
      subType: '',
      bedrooms: '',
      bathrooms: '',
      squareFeet: '',
      status: 'available',
      description: '',
      features: '',
      images: [],
      imageUrl: '',
      videoUrl: '',
      publishedToFrontend: true
    });
    setSelectedProperty(null);
    setShowAddModal(false);
    setShowEditModal(false);
    setUploadMethod('url');
    setSelectedFiles([]);
    setUploadedImages([]);
  };

  // Filter and search logic
  const filteredProperties = properties.filter(property => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      property.name?.toLowerCase().includes(searchLower) ||
      property.location?.toLowerCase().includes(searchLower) ||
      property.description?.toLowerCase().includes(searchLower);

    // Property code search
    const matchesPropertyCode = !propertyCodeSearch || 
      property.propertyCode?.toLowerCase().includes(propertyCodeSearch.toLowerCase());

    // Type filter
    const matchesType = filterType === 'all' || property.type === filterType;

    // SubType filter
    const matchesSubType = filterSubType === 'all' || property.subType === filterSubType;

    // Status filter
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;

    // Price range filter
    const matchesMinPrice = !minPrice || property.price >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || property.price <= Number(maxPrice);

    // Location filters
    const matchesZone = filterZone === 'all' || property.zone === filterZone;
    const matchesThana = filterThana === 'all' || property.thana === filterThana;
    const matchesArea = filterArea === 'all' || property.area === filterArea;

    return matchesSearch && matchesPropertyCode && matchesType && matchesSubType && matchesStatus && matchesMinPrice && matchesMaxPrice && matchesZone && matchesThana && matchesArea;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, propertyCodeSearch, filterType, filterSubType, filterStatus, minPrice, maxPrice, filterZone, filterThana, filterArea]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      
      <div className="container mx-auto px-0 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Property Management</h1>
            <p className="text-gray-600 mt-1">{user?.role === 'agent' ? 'View assigned properties' : 'Add, edit, and manage all properties'}</p>
          </div>
          {user?.role !== 'agent' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Property</span>
            </button>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, location..."
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

            {/* Property Code Search */}
            <div className="lg:col-span-1">
              <input
                type="text"
                placeholder="Property Code"
                value={propertyCodeSearch}
                onChange={(e) => setPropertyCodeSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterSubType('all');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">Home/House</option>
                <option value="Duplex">Duplex/Triplex</option>
                <option value="Land">Plot/Land</option>
                <option value="Commercial">Commercial Space</option>
              </select>
            </div>

            {/* SubType Filter */}
            <div>
              <select
                value={filterSubType}
                onChange={(e) => setFilterSubType(e.target.value)}
                disabled={filterType === 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">All SubTypes</option>
                {filterType === 'Apartment' && (
                  <>
                    <option value="Brand New Flat">Brand New Flat</option>
                    <option value="Used Flat">Used Flat</option>
                    <option value="Flat with Bank Loan">Flat with Bank Loan</option>
                    <option value="Flat with Gas">Flat with Gas</option>
                    <option value="Upcoming Flat">Upcoming Flat</option>
                    <option value="Luxury Flat">Luxury Flat</option>
                  </>
                )}
                {filterType === 'House' && (
                  <>
                    <option value="Ready Made">Ready Made</option>
                    <option value="Home with Gas">Home with Gas</option>
                  </>
                )}
                {filterType === 'Land' && (
                  <>
                    <option value="Ready Plot">Ready Plot</option>
                    <option value="Developing Plot">Developing Plot</option>
                    <option value="Project Plot">Project Plot</option>
                  </>
                )}
                {filterType === 'Commercial' && (
                  <>
                    <option value="Shop">Shop</option>
                    <option value="Office">Office</option>
                    <option value="Industrial">Industrial</option>
                  </>
                )}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="pending">Pending</option>
                <option value="rented">Rented</option>
              </select>
            </div>

            {/* Min Price */}
            <div>
              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Max Price */}
            <div>
              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <select
                value={filterZone}
                onChange={(e) => {
                  setFilterZone(e.target.value);
                  setFilterThana('all');
                  setFilterArea('all');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Zones</option>
                {Object.keys(locationData).map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterThana}
                onChange={(e) => {
                  setFilterThana(e.target.value);
                  setFilterArea('all');
                }}
                disabled={filterZone === 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="all">All Thanas</option>
                {filterZone !== 'all' && locationData[filterZone] && Object.keys(locationData[filterZone] || {}).map(thana => (
                  <option key={thana} value={thana}>{thana}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                disabled={filterThana === 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="all">All Areas</option>
                {filterZone !== 'all' && filterThana !== 'all' && locationData[filterZone]?.[filterThana] && locationData[filterZone][filterThana].map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || minPrice || maxPrice || filterZone !== 'all' || filterThana !== 'all' || filterArea !== 'all') && (
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
              {filterType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  Type: {filterType}
                  <button onClick={() => setFilterType('all')} className="hover:text-purple-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-green-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {minPrice && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Min: ৳{Number(minPrice).toLocaleString()}
                  <button onClick={() => setMinPrice('')} className="hover:text-orange-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {maxPrice && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  Max: ৳{Number(maxPrice).toLocaleString()}
                  <button onClick={() => setMaxPrice('')} className="hover:text-red-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterZone !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  Zone: {filterZone}
                  <button onClick={() => {
                    setFilterZone('all');
                    setFilterThana('all');
                    setFilterArea('all');
                  }} className="hover:text-indigo-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterThana !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  Thana: {filterThana}
                  <button onClick={() => {
                    setFilterThana('all');
                    setFilterArea('all');
                  }} className="hover:text-indigo-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filterArea !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  Area: {filterArea}
                  <button onClick={() => setFilterArea('all')} className="hover:text-indigo-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                  setMinPrice('');
                  setMaxPrice('');
                  setFilterZone('all');
                  setFilterThana('all');
                  setFilterArea('all');
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Results Count and Items Per Page */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm text-gray-600">
              Showing {filteredProperties.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length} properties
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Properties Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">
                {properties.length === 0 
                  ? 'No properties found. Add your first property to get started.'
                  : 'No properties match your filters. Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-600  ">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedProperties.map((property) => (
                      <tr key={property._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {property.propertyCode || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{property.name}</div>
                          <div className="text-sm text-gray-500">{property.bedrooms} bed • {property.bathrooms} bath</div>
                        </td>
                        <td className="px-4 py-4  text-sm text-gray-900">{property.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">৳{property.price?.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{property.type}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            property.status === 'available' ? 'bg-green-100 text-green-800' :
                            property.status === 'sold' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {property.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user?.role === 'agent' ? (
                            <span className="text-gray-500 italic">View Only</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(property)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(property._id)}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
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
                            <span className="px-1 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {showEditModal ? 'Edit Property' : 'Add New Property'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Code</label>
                  <input
                    type="text"
                    name="propertyCode"
                    value={formData.propertyCode}
                    onChange={handleInputChange}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generated code</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (৳)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                    <select
                      name="zone"
                      value={formData.zone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Zone</option>
                      {Object.keys(locationData).map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thana</label>
                    <select
                      name="thana"
                      value={formData.thana}
                      onChange={handleInputChange}
                      disabled={!formData.zone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select Thana</option>
                      {formData.zone && locationData[formData.zone] && Object.keys(locationData[formData.zone] || {}).map(thana => (
                        <option key={thana} value={thana}>{thana}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <select
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      disabled={!formData.thana}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select Area</option>
                      {formData.zone && formData.thana && locationData[formData.zone]?.[formData.thana] && locationData[formData.zone][formData.thana].map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House">Home/House</option>
                    <option value="Duplex">Duplex/Triplex</option>
                    <option value="Land">Plot/Land</option>
                    <option value="Commercial">Commercial Space</option>
                  </select>
                </div>

                {/* Conditional SubType Field */}
                {formData.type === 'Apartment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apartment Type</label>
                    <select
                      name="subType"
                      value={formData.subType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="Brand New Flat">Brand New Flat</option>
                      <option value="Used Flat">Used Flat</option>
                      <option value="Flat with Bank Loan">Flat with Bank Loan</option>
                      <option value="Flat with Gas">Flat with Gas</option>
                      <option value="Upcoming Flat">Upcoming Flat</option>
                      <option value="Luxury Flat">Luxury Flat</option>
                    </select>
                  </div>
                )}

                {formData.type === 'House' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Type</label>
                    <select
                      name="subType"
                      value={formData.subType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="Ready Made Home">Readymade Home</option>
                      <option value="Home with Gas">Home with Gas</option>
                    </select>
                  </div>
                )}

                {formData.type === 'Land' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plot Type</label>
                    <select
                      name="subType"
                      value={formData.subType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="Ready Plot">Ready Plot</option>
                      <option value="Developing Plot">Developing Plot</option>
                      <option value="Project Plot">Project Plot</option>
                    </select>
                  </div>
                )}

                {formData.type === 'Commercial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commercial Type</label>
                    <select
                      name="subType"
                      value={formData.subType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="Shop">Shop</option>
                      <option value="Office">Office</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>
                )}

                {/* Status field stays the same position */}
                {(formData.type !== 'Apartment' && formData.type !== 'House' && formData.type !== 'Land' && formData.type !== 'Commercial') && (
                  <div></div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                {/* Show bedrooms/bathrooms only for Apartment and Duplex */}
                {(formData.type === 'Apartment' || formData.type === 'Duplex') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                      <input
                        type="number"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                      <input
                        type="number"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'House' || formData.type === 'Land' ? 'Katha' : 'Square Feet'}
                  </label>
                  <input
                    type="text"
                    name="squareFeet"
                    value={formData.squareFeet}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Image Upload Section */}
                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Property Images</label>
                  
                  {/* Upload Method Toggle */}
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="url"
                        checked={uploadMethod === 'url'}
                        onChange={(e) => setUploadMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Image URLs</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="file"
                        checked={uploadMethod === 'file'}
                        onChange={(e) => setUploadMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Upload Files</span>
                    </label>
                  </div>

                  {/* URL Input Method */}
                  {uploadMethod === 'url' && (
                    <div>
                      <input
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="e.g., https://example.com/image1.jpg, https://example.com/image2.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter multiple image URLs separated by commas</p>
                    </div>
                  )}

                  {/* File Upload Method */}
                  {uploadMethod === 'file' && (
                    <div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          id="imageFiles"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleFileSelect}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <button
                          type="button"
                          onClick={handleFileUpload}
                          disabled={uploading || selectedFiles.length === 0}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {uploading ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <span>Upload</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Select up to 10 images (JPEG, PNG, GIF, WebP). Max 10MB each.</p>
                      
                      {/* Selected files preview */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">{selectedFiles.length} file(s) selected:</p>
                          <ul className="text-xs text-blue-600 mt-1">
                            {selectedFiles.map((file, index) => (
                              <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Uploaded images preview */}
                      {uploadedImages.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Images ({uploadedImages.length}):</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {uploadedImages.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`Uploaded ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUploadedImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show existing images when editing */}
                  {showEditModal && formData.images && formData.images.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Current Images ({formData.images.length}):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {formData.images.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Current ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                  <input
                    type="text"
                    name="features"
                    value={formData.features}
                    onChange={handleInputChange}
                    placeholder="e.g., Pool, Garage, Garden, Security"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video URL</label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    placeholder="e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Add a YouTube video tour or walkthrough of the property</p>
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
                  {showEditModal ? 'Update Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;
