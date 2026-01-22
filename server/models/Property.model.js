import mongoose from 'mongoose';

// Simple code prefix for all properties
const CODE_PREFIX = 'code';

// Function to generate unique property code (fallback)
const generatePropertyCode = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${CODE_PREFIX}-${timestamp}${random}`;
};

const propertySchema = new mongoose.Schema({
  propertyCode: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  zone: {
    type: String,
    trim: true
  },
  thana: {
    type: String,
    trim: true
  },
  area: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    enum: ['sold', 'premium', 'sell', 'rent'],
    default: 'sell'
  },
  type: {
    type: String,
    enum: ['land', 'building', 'house', 'apartment', 'commercial', 'villa', 'penthouse', 'Land', 'Building', 'House', 'Apartment', 'Commercial', 'Villa', 'Penthouse', 'Condo', 'Townhouse', 'condo', 'townhouse', 'Duplex'],
    required: [true, 'Property type is required']
  },
  subType: {
    type: String,
    trim: true
  },
  squareFeet: {
    type: Number,
    required: [true, 'Square feet is required'],
    min: 0
  },
  bedrooms: {
    type: Number,
    default: 0,
    min: 0
  },
  bathrooms: {
    type: Number,
    default: 0,
    min: 0
  },
  images: [{
    type: String
  }],
  features: [{
    type: String
  }],
  videoUrl: {
    type: String,
    trim: true
  },
  // Admin tracking fields
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedToFrontend: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  inquiryCount: {
    type: Number,
    default: 0
  },
  // Additional details
  yearBuilt: {
    type: Number
  },
  parkingSpaces: {
    type: Number,
    default: 0
  },
  amenities: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['available', 'under_contract', 'sold', 'rented'],
    default: 'available'
  }
}, {
  timestamps: true
});

// Index for search optimization
propertySchema.index({ name: 'text', location: 'text', description: 'text' });
propertySchema.index({ type: 1, state: 1, status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ propertyCode: 1 });

// Pre-save hook to ensure propertyCode is generated with simple format (code-101, code-102, etc.)
propertySchema.pre('save', async function(next) {
  if (!this.propertyCode) {
    try {
      // Find the highest existing code number
      const regex = new RegExp(`^${CODE_PREFIX}-(\\d+)$`);
      const existingProperties = await mongoose.model('Property').find({
        propertyCode: regex
      }).select('propertyCode');
      
      let maxNumber = 100; // Start from 101
      existingProperties.forEach(prop => {
        const match = prop.propertyCode.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      
      const nextNumber = maxNumber + 1;
      this.propertyCode = `${CODE_PREFIX}-${nextNumber}`;
    } catch (error) {
      // Fallback to random code if something goes wrong
      this.propertyCode = generatePropertyCode();
    }
  }
  next();
});

const Property = mongoose.model('Property', propertySchema);

export { CODE_PREFIX, generatePropertyCode };
export default Property;
