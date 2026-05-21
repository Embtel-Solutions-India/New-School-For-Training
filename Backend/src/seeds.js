import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✓ Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sft.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = 'Platform Administrator';

    console.log(`\n🔍 Checking for existing admin (${adminEmail})...`);
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`✓ Admin already exists with ID: ${existingAdmin._id}`);
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log('ℹ️  Skipping seed to avoid duplicates.\n');
      process.exit(0);
    }

    console.log('✓ No existing admin found, creating new admin account...\n');

    const newAdmin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      provider: 'local',
      isVerified: true,
      accountStatus: 'active',
      username: 'admin',
    });

    await newAdmin.save();

    console.log('✅ Admin account created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   👤 Name: ${adminName}`);
    console.log(`   🔐 Role: admin`);
    console.log(`   🆔 ID: ${newAdmin._id}`);
    console.log(`   ✓ Verified: Yes`);
    console.log(`   ✓ Status: Active\n`);

    console.log('⚠️  Important:');
    console.log('   1. Save this password securely');
    console.log('   2. Change the default password after first login');
    console.log('   3. Never commit credentials to version control\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    if (error.code === 11000) {
      console.error('   → Duplicate key error: Admin email likely already exists');
    }
    process.exit(1);
  }
};

seedAdmin();
