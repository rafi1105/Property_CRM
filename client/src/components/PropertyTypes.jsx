import { Link } from 'react-router';

const PropertyTypes = () => {
  const propertyTypes = [
    {
      id: 1,
      name: 'Residential Houses',
      description: 'Beautiful family homes in prime locations',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600',
      count: '150+',
      icon: '🏠',
    },
    {
      id: 2,
      name: 'Luxury Apartments',
      description: 'Modern apartments with premium amenities',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
      count: '200+',
      icon: '🏢',
    },
    {
      id: 3,
      name: 'Commercial Spaces',
      description: 'Prime commercial properties for your business',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
      count: '80+',
      icon: '🏪',
    },
    {
      id: 4,
      name: 'Land & Plots',
      description: 'Premium land for residential or commercial use',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
      count: '120+',
      icon: '🌳',
    },
  ];

  return (
    <section className="section-py bg-white">
      <div className="container mx-auto container-padding">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-12 lg:mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Browse Property Types
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg">
              Explore our diverse range of properties tailored to your needs
            </p>
          </div>

          {/* Property Types Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {propertyTypes.map((type, index) => (
              <Link
                key={type.id}
                to="/property"
                className="group relative overflow-hidden rounded-2xl shadow-lg hover-lift"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image */}
                <div className="relative h-64 sm:h-72 overflow-hidden">
                  <img
                    src={type.image}
                    alt={type.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {/* Icon Badge */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                    {type.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 bg-[var(--color-primary)] rounded-full text-sm font-semibold">
                      {type.count} Properties
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{type.name}</h3>
                  <p className="text-gray-200 text-sm">{type.description}</p>
                  
                  {/* Arrow Icon */}
                  <div className="mt-3 flex items-center text-white group-hover:translate-x-2 transition-transform duration-300">
                    <span className="text-sm font-medium mr-2">Explore</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link
              to="/property"
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <span>View All Properties</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyTypes;