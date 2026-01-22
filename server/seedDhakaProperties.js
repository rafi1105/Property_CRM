import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from './models/Property.model.js';
import User from './models/User.model.js';

dotenv.config();

// Demo properties in Dhaka with images
const dhakaProperties = [
  {
    name: "Luxury Apartment in Gulshan 2",
    description: "Modern 3-bedroom apartment with stunning city views, fully furnished with premium amenities. Located in the heart of Gulshan diplomatic zone with 24/7 security.",
    price: 45000000,
    location: "Gulshan 2, Dhaka",
    address: "Road 52, Gulshan 2",
    city: "Dhaka",
    state: "sell",
    type: "apartment",
    squareFeet: 2200,
    bedrooms: 3,
    bathrooms: 3,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
    ],
    features: [
      "24/7 Security",
      "Backup Generator",
      "Elevator",
      "Parking",
      "Gym",
      "Swimming Pool"
    ],
    amenities: [
      "Central AC",
      "Modern Kitchen",
      "Balcony",
      "Servant Room",
      "Store Room"
    ],
    yearBuilt: 2020,
    parkingSpaces: 2,
    publishedToFrontend: true,
    isPublished: true,
    status: "available"
  },
  {
    name: "Premium Villa in Banani DOHS",
    description: "Exquisite 5-bedroom villa with private garden and rooftop terrace. Perfect for families seeking luxury living in a secure gated community.",
    price: 85000000,
    location: "Banani DOHS, Dhaka",
    address: "Road 8, Banani DOHS",
    city: "Dhaka",
    state: "premium",
    type: "villa",
    squareFeet: 4500,
    bedrooms: 5,
    bathrooms: 5,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"
    ],
    features: [
      "Private Garden",
      "Rooftop Terrace",
      "Home Automation",
      "CCTV",
      "Intercom",
      "Fire Safety System"
    ],
    amenities: [
      "Home Theater",
      "Wine Cellar",
      "Guest Suite",
      "Maid Quarter",
      "3 Car Garage"
    ],
    yearBuilt: 2021,
    parkingSpaces: 3,
    publishedToFrontend: true,
    isPublished: true,
    status: "available"
  },
  {
    name: "Modern Condo in Dhanmondi",
    description: "Beautiful 2-bedroom contemporary condo in prime Dhanmondi location. Walking distance to restaurants, shopping, and entertainment.",
    price: 32000000,
    location: "Dhanmondi, Dhaka",
    address: "Road 27, Dhanmondi",
    city: "Dhaka",
    state: "sell",
    type: "condo",
    squareFeet: 1650,
    bedrooms: 2,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"
    ],
    features: [
      "Elevator",
      "Generator",
      "Secured Parking",
      "Modern Design",
      "Natural Light"
    ],
    amenities: [
      "Open Kitchen",
      "Balcony",
      "Storage Space",
      "Laundry Room"
    ],
    yearBuilt: 2019,
    parkingSpaces: 1,
    publishedToFrontend: true,
    isPublished: true,
    status: "available"
  },
  {
    name: "Commercial Space in Motijheel",
    description: "Prime commercial property in the heart of Dhaka's business district. Ideal for corporate offices, banks, or retail businesses.",
    price: 65000000,
    location: "Motijheel, Dhaka",
    address: "Motijheel Commercial Area",
    city: "Dhaka",
    state: "sell",
    type: "commercial",
    squareFeet: 3500,
    bedrooms: 0,
    bathrooms: 4,
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800"
    ],
    features: [
      "High Speed Elevator",
      "24/7 Security",
      "Backup Power",
      "Central AC",
      "Fire Safety"
    ],
    amenities: [
      "Conference Rooms",
      "Cafeteria Space",
      "Server Room",
      "Reception Area"
    ],
    yearBuilt: 2018,
    parkingSpaces: 10,
    publishedToFrontend: true,
    isPublished: true,
    status: "available"
  },
  {
    name: "Affordable Apartment in Mirpur",
    description: "Comfortable 3-bedroom apartment perfect for families. Well-connected to transportation and all amenities nearby.",
    price: 18000000,
    location: "Mirpur DOHS, Dhaka",
    address: "Avenue 3, Mirpur DOHS",
    city: "Dhaka",
    state: "sell",
    type: "apartment",
    squareFeet: 1400,
    bedrooms: 3,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800",
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"
    ],
    features: [
      "Elevator",
      "Generator",
      "Parking",
      "Security"
    ],
    amenities: [
      "Modular Kitchen",
      "Balcony",
      "Store Room"
    ],
    yearBuilt: 2017,
    parkingSpaces: 1,
    publishedToFrontend: true,
    isPublished: true,
    status: "available"
  },
  {
    name: "Luxury Penthouse in Bashundhara",
    description: "Spectacular penthouse with panoramic city views. Features include rooftop pool, private elevator, and smart home technology.",
    price: 95000000,
    location: "Bashundhara R/A, Dhaka",
    address: "Block G, Bashundhara",
    city: "Dhaka",
    state: "premium",
    type: "penthouse",
    squareFeet: 5000,
    bedrooms: 4,
    bathrooms: 4,
    images: [
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"
    ],
    features: [
      "Private Elevator",
      "Rooftop Pool",
      "Smart Home System",
      "360° Views",
      "Premium Security"
    ],
    amenities: [
      "Private Gym",
      "Bar Area",
      "Library",
      "Home Office",
      "Staff Quarters"
    ],
    yearBuilt: 2022,
    parkingSpaces: 3,
    publishedToFrontend: true,
    isPublished: true,
    status: "available"
  },
  {
    name: "Family House in Uttara",
    description: "Spacious 4-bedroom house with front and back yard. Perfect for growing families in a peaceful neighborhood.",
    price: 55000000,
    location: "Uttara Sector 7, Dhaka",
    address: "Road 12, Sector 7, Uttara",
    city: "Dhaka",
    state: "sell",
    type: "house",
    squareFeet: 3200,
    bedrooms: 4,
    bathrooms: 3,
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800"
    ],
    features: [
      "Front Yard",
      "Back Yard",
      "Garage",
      "Security System",
      "Generator"
    ],
    amenities: [
      "Modern Kitchen",
      "Study Room",
      "Servant Quarter",
      "Storage"
    ],
    yearBuilt: 2019,
    parkingSpaces: 2,
    publishedToFrontend: true,
    isPublished: true,
    status: "available"
  },
  {
    name: "Rental Apartment in Mohammadpur",
    description: "Cozy 2-bedroom apartment available for rent. Fully furnished with all modern amenities.",
    price: 35000,
    location: "Mohammadpur, Dhaka",
    address: "Block A, Mohammadpur",
    city: "Dhaka",
    state: "rent",
    type: "apartment",
    squareFeet: 1100,
    bedrooms: 2,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"
    ],
    features: [
      "Furnished",
      "Elevator",
      "Backup Power",
      "Parking"
    ],
    amenities: [
      "Kitchen Appliances",
      "Balcony",
      "Washing Machine"
    ],
    yearBuilt: 2016,
    parkingSpaces: 1,
    publishedToFrontend: true,
    isPublished: true,
    status: "available"
  }
];

const seedProperties = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an admin user to set as uploadedBy
    const admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    
    if (!admin) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${admin.name} (${admin.email})`);

    // Clear existing demo properties (optional)
    // await Property.deleteMany({ city: 'Dhaka' });
    // console.log('🗑️  Cleared existing Dhaka properties');

    // Add uploadedBy to all properties
    const propertiesWithUser = dhakaProperties.map(prop => ({
      ...prop,
      uploadedBy: admin._id
    }));

    // Insert properties
    const result = await Property.insertMany(propertiesWithUser);
    console.log(`✅ Successfully added ${result.length} properties in Dhaka!`);

    // Display summary
    console.log('\n📊 Property Summary:');
    result.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.name} - ৳${prop.price.toLocaleString()}`);
    });

    console.log('\n✨ Demo properties seeded successfully!');
    console.log('🌐 Visit: https://sintecproperty.web.app/dashboard/properties');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding properties:', error);
    process.exit(1);
  }
};

// Run the seed function
seedProperties();
