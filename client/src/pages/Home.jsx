import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import PropertyCard from '../components/PropertyCard';
import PropertyTypes from '../components/PropertyTypes';
import WhyChooseUs from '../components/WhyChooseUs';
import HowItWorks from '../components/HowItWorks';
import AboutStory from '../components/AboutStory';
import ReviewClient from '../components/ReviewClient';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';
import { propertyAPI } from '../utils/api';
import { toast } from 'react-toastify';


const Home = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyAPI.getAll();
        // Filter for featured/premium properties
        const properties = response.data.properties || [];
        const featured = properties
          .filter((property) => property.status === 'available')
          .slice(0, 6);
        setFeaturedProperties(featured);
      } catch (error) {
        console.error('Error fetching properties:', error);
        // Fallback to empty array if API fails
        setFeaturedProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroBanner />

      {/* Featured Properties Section */}
      <section className="section-py bg-white">
        <div className="container mx-auto container-padding">
          <div className="text-center mb-12 lg:mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Featured Properties
            </h2>
            <div className="w-24 h-1 bg-linear-to-r from-blue-600 to-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Discover our handpicked selection of premium properties
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {loading ? (
              // Loading skeleton
              Array(6).fill(0).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map((property, index) => (
                <div
                  key={property._id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PropertyCard property={property} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 text-lg">No properties available at the moment.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/property"
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <span>View All Properties</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* New Sections */}
      <PropertyTypes />
      <WhyChooseUs />
      <HowItWorks />
      <AboutStory />
      <ReviewClient />
      <CallToAction />
      
      <Footer />
    </div>
  );
};

export default Home;
