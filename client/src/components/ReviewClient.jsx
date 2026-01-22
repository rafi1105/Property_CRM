const ReviewClient = () => {
  const reviews = [
    {
      id: 1,
      name: 'Ahmed Rahman',
      role: 'Property Owner',
      image: 'https://i.pravatar.cc/150?img=12',
      rating: 5,
      comment:
        'Excellent service! Sintec  helped me sell my property quickly at a great price. Highly professional team.',
    },
    {
      id: 2,
      name: 'Fatima Khatun',
      role: 'Home Buyer',
      image: 'https://i.pravatar.cc/150?img=45',
      rating: 5,
      comment:
        'Found my dream home through Sintec . The process was smooth and the team was very supportive throughout.',
    },
    {
      id: 3,
      name: 'Karim Hassan',
      role: 'Investor',
      image: 'https://i.pravatar.cc/150?img=33',
      rating: 5,
      comment:
        'Great investment opportunities and expert advice. Sintec  is my go-to for real estate investments.',
    },
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              What Our Clients Say
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our satisfied clients
              have to say about their experience with Sintec .
            </p>
          </div>

          {/* Reviews Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                {/* Stars */}
                <div className="flex mb-4">{renderStars(review.rating)}</div>

                {/* Comment */}
                <p className="text-gray-600 mb-6 italic">"{review.comment}"</p>

                {/* Client Info */}
                <div className="flex items-center">
                  <img
                    src={review.image}
                    alt={review.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{review.name}</p>
                    <p className="text-sm text-gray-600">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewClient;
