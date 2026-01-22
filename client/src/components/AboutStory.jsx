const AboutStory = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Our Story
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"
                alt="About Sintec Properties"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Building Dreams Since 2010
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Sintec Properties has been at the forefront of real estate in Bangladesh,
                helping thousands of families find their perfect home and investors
                discover lucrative opportunities.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                With over a decade of experience, we pride ourselves on providing
                exceptional service, expert guidance, and access to the finest
                properties across the country. Our commitment to transparency,
                integrity, and customer satisfaction has made us one of the most
                trusted names in real estate.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-1">1000+</p>
                  <p className="text-gray-600 text-sm">Properties Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-1">5000+</p>
                  <p className="text-gray-600 text-sm">Happy Clients</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-1">15+</p>
                  <p className="text-gray-600 text-sm">Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutStory;
