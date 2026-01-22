import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Function to generate unique property code
const generatePropertyCode = () => {
  const prefix = 'PROP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const migratePropertyCodes = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the properties collection directly
    const db = mongoose.connection.db;
    const propertiesCollection = db.collection('properties');

    // Find all properties without propertyCode or with null/empty propertyCode
    const propertiesWithoutCode = await propertiesCollection.find({
      $or: [
        { propertyCode: { $exists: false } },
        { propertyCode: null },
        { propertyCode: '' }
      ]
    }).toArray();

    console.log(`Found ${propertiesWithoutCode.length} properties without codes`);

    if (propertiesWithoutCode.length === 0) {
      console.log('All properties already have codes. Nothing to migrate.');
      await mongoose.disconnect();
      return;
    }

    // Update each property with a unique code
    let updatedCount = 0;
    for (const property of propertiesWithoutCode) {
      // Add a small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const newCode = generatePropertyCode();
      
      await propertiesCollection.updateOne(
        { _id: property._id },
        { $set: { propertyCode: newCode } }
      );
      
      console.log(`Updated property "${property.name}" with code: ${newCode}`);
      updatedCount++;
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} properties with new codes.`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

// Run the migration
migratePropertyCodes();
