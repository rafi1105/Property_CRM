import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';

dotenv.config();

const fixDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Drop the problematic index
    try {
      await usersCollection.dropIndex('firebaseUid_1');
      console.log('✅ Dropped firebaseUid_1 index');
    } catch (error) {
      console.log('⚠️  Index might not exist or already dropped');
    }

    // Create proper sparse unique index
    await usersCollection.createIndex(
      { firebaseUid: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('✅ Created new sparse unique index on firebaseUid');

    // Now check and create Rafi's account
    let user = await User.findOne({ email: 'rafikabir05.rk@gmail.com' });
    
    if (user) {
      console.log('\n✅ Your account already exists!');
      if (user.role !== 'super_admin') {
        user.role = 'super_admin';
        await user.save();
        console.log('✅ Updated role to super_admin');
      }
    } else {
      user = await User.create({
        name: 'Rafi Kabir',
        email: 'rafikabir05.rk@gmail.com',
        password: 'Rafi1234@',
        role: 'super_admin',
        phone: '+8801234567890',
        address: 'Dhaka, Bangladesh',
        authProvider: 'email',
        isActive: true
      });
      console.log('\n✅ Super Admin account created!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 Your Super Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: rafikabir05.rk@gmail.com');
    console.log('🔑 Password: Rafi1234@');
    console.log('👤 Role: super_admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Login at: http://localhost:5174/admin-login');
    console.log('   1. Select "Super Admin" radio button');
    console.log('   2. Enter your email and password');
    console.log('   3. Click Sign in');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixDatabase();
