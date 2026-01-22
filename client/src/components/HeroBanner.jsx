import { Link } from 'react-router';
import { useState } from 'react';
import { locationData } from '../data/locations';

const HeroBanner = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedThana, setSelectedThana] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Get thanas based on selected zone
  const getThanas = () => {
    if (!selectedZone || !locationData[selectedZone]) return [];
    return Object.keys(locationData[selectedZone]);
  };

  // Get areas based on selected thana
  const getAreas = () => {
    if (!selectedZone || !selectedThana || !locationData[selectedZone]?.[selectedThana]) return [];
    return locationData[selectedZone][selectedThana];
  };

  const handleZoneChange = (zone) => {
    setSelectedZone(zone);
    setSelectedThana('');
    setSelectedArea('');
  };

  const handleThanaChange = (thana) => {
    setSelectedThana(thana);
    setSelectedArea('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set('search', searchTerm);
    }
    if (selectedZone) {
      params.set('zone', selectedZone);
    }
    if (selectedThana) {
      params.set('thana', selectedThana);
    }
    if (selectedArea) {
      params.set('area', selectedArea);
    }
    window.location.href = `/property?${params.toString()}`;
  };

  return (
    <div
      className="relative text-white overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.48), rgba(0,0,0,0.78)), url('/banner.png'), url('/banner.svg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Animated Background Pattern */}
      {/* <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div> */}

      {/* Floating Shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="container mx-auto container-padding py-16 sm:py-20 md:py-28 lg:py-36 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6 animate-slide-in-down">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">1000+ Properties Available</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 animate-slide-in-up leading-tight">
            Find Your Dream Property
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 text-blue-100 max-w-3xl mx-auto animate-slide-in-up leading-relaxed" style={{ animationDelay: '100ms' }}>
            Discover the perfect home, apartment, or land for your future. Premium properties in prime locations across Bangladesh.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-8 sm:mb-10 animate-scale-in" style={{ animationDelay: '200ms' }}>
            <div className="flex flex-col gap-3 bg-white p-3 rounded-xl shadow-2xl">
              {/* Search Input */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by location or property name..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-gray-800 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-lg border border-gray-200"
              />
              
              {/* Location Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Zone Filter */}
                <select
                  value={selectedZone}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  className="px-4 py-3 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base border border-gray-200 bg-white"
                >
                  <option value="">All Zones</option>
                  {Object.keys(locationData).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>

                {/* Thana Filter */}
                <select
                  value={selectedThana}
                  onChange={(e) => handleThanaChange(e.target.value)}
                  disabled={!selectedZone}
                  className="px-4 py-3 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Thanas</option>
                  {getThanas().map(thana => (
                    <option key={thana} value={thana}>{thana}</option>
                  ))}
                </select>

                {/* Area Filter */}
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  disabled={!selectedThana}
                  className="px-4 py-3 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Areas</option>
                  {getAreas().map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search Properties</span>
              </button>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in-up" style={{ animationDelay: '300ms' }}>
            <Link
              to="/property"
              className="w-full sm:w-auto bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 text-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2"
            >
              <span>Browse All Properties</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 text-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact Us</span>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">1000+</p>
              <p className="text-blue-200 text-xs sm:text-sm">Properties</p>
            </div>
            <div className="text-center border-l border-r border-white/30">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">5000+</p>
              <p className="text-blue-200 text-xs sm:text-sm">Happy Clients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">15+</p>
              <p className="text-blue-200 text-xs sm:text-sm">Years Experience</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
};

export default HeroBanner;
