import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';

dotenv.config();

const createRafiAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Check if Rafi's account exists
    const existing = await User.findOne({ email: 'rafikabir05.rk@gmail.com' });
    
    if (existing) {
      console.log('✅ Your account already exists!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', existing.email);
      console.log('👤 Name:', existing.name);
      console.log('🔑 Role:', existing.role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (existing.role !== 'super_admin') {
        existing.role = 'super_admin';
        await existing.save();
        console.log('✅ Updated role to super_admin');
      }
      
      process.exit(0);
    }

    // Create new account
    const user = new User({
      name: 'Rafi Kabir',
      email: 'rafikabir05.rk@gmail.com',
      password: 'Rafi1234@',
      role: 'super_admin',
      phone: '+8801234567890',
      address: 'Dhaka, Bangladesh',
      authProvider: 'email',
      isActive: true
    });

    await user.save();

    console.log('✅ Super Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: rafikabir05.rk@gmail.com');
    console.log('🔑 Password: Rafi1234@');
    console.log('👤 Role: super_admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Login at: http://localhost:5174/admin-login');
    console.log('   Select "Super Admin" and use your credentials');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createRafiAdmin();
