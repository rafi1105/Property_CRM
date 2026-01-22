// Migration script to reset all property codes to simple format (code-101, code-102, etc.)
// Run this script once: node migrateToFriendlyCodes.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Simple code prefix for all properties
const CODE_PREFIX = 'code';

const migratePropertyCodes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const propertiesCollection = db.collection('properties');

    // Get all properties
    const properties = await propertiesCollection.find({}).toArray();
    console.log(`Found ${properties.length} total properties`);

    // Sort properties by creation date to maintain order
    properties.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let counter = 100; // Start from 101
    const updates = [];

    for (const property of properties) {
      counter++;
      const newCode = `${CODE_PREFIX}-${counter}`;

      updates.push({
        updateOne: {
          filter: { _id: property._id },
          update: { $set: { propertyCode: newCode } }
        }
      });

      console.log(`Property "${property.name}" (${property.type}): ${property.propertyCode || 'N/A'} -> ${newCode}`);
    }

    if (updates.length > 0) {
      const result = await propertiesCollection.bulkWrite(updates);
      console.log(`\n✅ Migration complete! Updated ${result.modifiedCount} properties`);
    }

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`  Total properties: ${properties.length}`);
    if (properties.length > 0) {
      console.log(`  Property codes: ${CODE_PREFIX}-101 to ${CODE_PREFIX}-${counter}`);
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migratePropertyCodes();
