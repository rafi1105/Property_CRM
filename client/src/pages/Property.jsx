import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import Footer from '../components/Footer';
import { propertyAPI } from '../utils/api';
import { locationData } from '../data/locations';


const Property = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [propertyCodeSearch, setPropertyCodeSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSubType, setFilterSubType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState(searchParams.get('zone') || 'all');
  const [filterThana, setFilterThana] = useState(searchParams.get('thana') || 'all');
  const [filterArea, setFilterArea] = useState(searchParams.get('area') || 'all');
  const [sortBy, setSortBy] = useState('default');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Get thanas based on selected zone
  const getThanas = () => {
    if (filterZone === 'all' || !locationData[filterZone]) return [];
    return Object.keys(locationData[filterZone]);
  };

  // Get areas based on selected thana
  const getAreas = () => {
    if (filterZone === 'all' || filterThana === 'all' || !locationData[filterZone]?.[filterThana]) return [];
    return locationData[filterZone][filterThana];
  };

  // Handle zone change - reset thana and area
  const handleZoneChange = (zone) => {
    setFilterZone(zone);
    setFilterThana('all');
    setFilterArea('all');
    setCurrentPage(1);
  };

  // Handle thana change - reset area
  const handleThanaChange = (thana) => {
    setFilterThana(thana);
    setFilterArea('all');
    setCurrentPage(1);
  };

  // Handle area change
  const handleAreaChange = (area) => {
    setFilterArea(area);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Fetch all properties with high limit
        const response = await propertyAPI.getAll({ limit: 500 });
        const propertyData = response.data.properties || [];
        setProperties(Array.isArray(propertyData) ? propertyData : []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter and search logic
  let filteredProperties = Array.isArray(properties) ? properties.filter((property) => {
    const matchesSearch =
      property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPropertyCode = !propertyCodeSearch || 
      property.propertyCode?.toLowerCase().includes(propertyCodeSearch.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    const matchesSubType = filterSubType === 'all' || property.subType === filterSubType;
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    const matchesZone = filterZone === 'all' || property.zone === filterZone;
    const matchesThana = filterThana === 'all' || property.thana === filterThana;
    const matchesArea = filterArea === 'all' || property.area === filterArea;

    return matchesSearch && matchesPropertyCode && matchesType && matchesSubType && matchesStatus && matchesZone && matchesThana && matchesArea;
  }) : [];

  // Sorting logic
  if (sortBy === 'price-low') {
    filteredProperties = [...filteredProperties].sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === 'price-high') {
    filteredProperties = [...filteredProperties].sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sortBy === 'sqft-low') {
    filteredProperties = [...filteredProperties].sort(
      (a, b) => (a.squareFeet || 0) - (b.squareFeet || 0)
    );
  } else if (sortBy === 'sqft-high') {
    filteredProperties = [...filteredProperties].sort(
      (a, b) => (b.squareFeet || 0) - (a.squareFeet || 0)
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProperties.length);
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, propertyCodeSearch, filterType, filterSubType, filterStatus, filterZone, filterThana, filterArea, sortBy, itemsPerPage]);

  // Ensure currentPage doesn't exceed totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="bg-blue-600 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Our Properties</h1>
            <p className="text-blue-100">
              Browse through our extensive collection of properties
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page Header */}
      <div className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Our Properties</h1>
          <p className="text-blue-100">
            Browse through our extensive collection of properties
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-4 top-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Property Code (e.g., PROP-...)"
                  value={propertyCodeSearch}
                  onChange={(e) => setPropertyCodeSearch(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-4 top-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterSubType('all');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub Type
              </label>
              <select
                value={filterSubType}
                onChange={(e) => setFilterSubType(e.target.value)}
                disabled={filterType === 'all'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="sqft-low">Size: Small to Large</option>
                <option value="sqft-high">Size: Large to Small</option>
              </select>
            </div>
          </div>

          {/* Location Filters */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Zone Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone
              </label>
              <select
                value={filterZone}
                onChange={(e) => handleZoneChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Zones</option>
                {Object.keys(locationData).map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* Thana Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thana
              </label>
              <select
                value={filterThana}
                onChange={(e) => handleThanaChange(e.target.value)}
                disabled={filterZone === 'all'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">All Thanas</option>
                {getThanas().map(thana => (
                  <option key={thana} value={thana}>{thana}</option>
                ))}
              </select>
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area
              </label>
              <select
                value={filterArea}
                onChange={(e) => handleAreaChange(e.target.value)}
                disabled={filterThana === 'all'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">All Areas</option>
                {getAreas().map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count and Items Per Page */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-gray-600">
            {filteredProperties.length > 0 ? (
              <>
                Showing <span className="font-semibold">{startIndex + 1}-{endIndex}</span>{' '}
                of <span className="font-semibold">{filteredProperties.length}</span> properties
              </>
            ) : (
              <span>No properties found</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>

        {/* Properties Grid */}
        {paginatedProperties.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedProperties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
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
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No properties found
            </h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Property;
