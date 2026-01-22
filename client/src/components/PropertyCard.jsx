import { Link } from 'react-router';

const PropertyCard = ({ property }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStateColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'sold':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStateIcon = (status) => {
    switch (status) {
      case 'available':
        return '🏷️';
      case 'sold':
        return '✓';
      case 'pending':
        return '⏳';
      default:
        return '';
    }
  };

  // Get the first image from images array or use default property image
  const defaultImage = '#';
  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0] 
    : defaultImage;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover-lift group h-full flex flex-col">
      {/* Image */}
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <img
          src={imageUrl}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Badge */}
        <span
          className={`absolute top-4 right-4 ${getStateColor(
            property.status
          )} text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold uppercase shadow-lg flex items-center space-x-1`}
        >
          <span>{getStateIcon(property.status)}</span>
          <span>{property.status}</span>
        </span>

        {/* Property Code Badge */}
        {property.propertyCode && (
          <span className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-mono shadow-lg">
            {property.propertyCode}
          </span>
        )}

        {/* Property Type Badge */}
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-lg capitalize">
          {property.type}
        </span>

        {/* Wishlist Button */}
        <button className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-50">
          <svg className="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
          {property.name}
        </h3>
        
        <p className="text-gray-600 mb-4 flex items-center text-sm">
          <svg
            className="w-4 h-4 mr-2 shrink-0 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="line-clamp-1">{property.location}</span>
        </p>

        {/* Property Details */}
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200">
          <span className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
            <svg
              className="w-4 h-4 mr-1.5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            <span className="font-medium">{property.squareFeet || 0} sqft</span>
          </span>
          {property.bedrooms > 0 && (
            <span className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
              <svg
                className="w-4 h-4 mr-1.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="font-medium">{property.bedrooms} Beds</span>
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
              <svg
                className="w-4 h-4 mr-1.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium">{property.bathrooms} Baths</span>
            </span>
          )}
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between gap-3 mt-auto">
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {formatPrice(property.price)}
            </p>
          </div>
          <Link 
            to={`/property/${property._id}`}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium text-sm sm:text-base flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <span>Details</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
