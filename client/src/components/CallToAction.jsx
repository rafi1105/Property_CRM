import { Link } from 'react-router';

const CallToAction = () => {
  return (
    <section className="section-py bg-[var(--bg-secondary)] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-secondary)]/5 rounded-full translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="container mx-auto container-padding relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center p-8 lg:p-12">
              {/* Content */}
              <div className="text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-slide-in-up">
                  Ready to Find Your Dream Property?
                </h2>
                <p className="text-blue-100 text-lg mb-6 leading-relaxed animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                  Join thousands of happy homeowners who found their perfect property with Sintec . 
                  Let our expert team guide you through every step of your real estate journey.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-1">1000+</p>
                    <p className="text-blue-100 text-sm">Properties</p>
                  </div>
                  <div className="text-center border-l border-r border-white/30">
                    <p className="text-3xl font-bold mb-1">5000+</p>
                    <p className="text-blue-100 text-sm">Happy Clients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-1">15+</p>
                    <p className="text-blue-100 text-sm">Years Experience</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-up" style={{ animationDelay: '300ms' }}>
                  <Link
                    to="/property"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-[var(--color-primary)] font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <span>Browse Properties</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[var(--color-primary)] transition-all duration-300 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Contact Us</span>
                  </Link>
                </div>
              </div>

              {/* Image/Illustration */}
              <div className="hidden lg:block relative">
                <div className="relative animate-scale-in" style={{ animationDelay: '200ms' }}>
                  <img
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600"
                    alt="Dream Home"
                    className="rounded-2xl shadow-2xl w-full h-auto"
                  />
                  {/* Floating Badge */}
                  <div className="absolute -bottom-6 -left-6 bg-white text-[var(--text-primary)] p-4 rounded-xl shadow-xl animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[var(--color-secondary)] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-lg">Verified</p>
                        <p className="text-sm text-[var(--text-secondary)]">Properties</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;