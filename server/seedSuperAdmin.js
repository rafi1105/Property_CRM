import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const superAdminAccounts = [
      {
        name: 'Super Admin',
        email: 'superadmin@realestate.com',
        password: 'admin123',
        role: 'super_admin',
        phone: '+8801234567890',
        address: 'Dhaka, Bangladesh'
      },
      {
        name: 'Rafi Kabir',
        email: 'rafikabir05.rk@gmail.com',
        password: 'Rafi1234@',
        role: 'super_admin',
        phone: '+8801234567890',
        address: 'Dhaka, Bangladesh'
      }
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const account of superAdminAccounts) {
      const existingUser = await User.findOne({ email: account.email });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${account.email}`);
        existingCount++;
        continue;
      }

      await User.create({
        name: account.name,
        email: account.email,
        password: account.password,
        role: account.role,
        phone: account.phone,
        address: account.address,
        authProvider: 'email',
        isActive: true
      });

      console.log(`✅ Created: ${account.email}`);
      createdCount++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Summary:`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Already existed: ${existingCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Super Admin Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣  Email: superadmin@realestate.com');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  Email: rafikabir05.rk@gmail.com');
    console.log('   Password: Rafi1234@');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Login at: http://localhost:5174/admin-login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
