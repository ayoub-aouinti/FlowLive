const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing users (optional - be careful)
    // await User.deleteMany({});

    const users = [
      { name: 'Super Admin', email: 'super@flow.com', password: 'password123', role: 'superadmin' },
      { name: 'Admin User', email: 'admin@flow.com', password: 'password123', role: 'admin' },
      { name: 'Standard User', email: 'user@flow.com', password: 'password123', role: 'user' }
    ];

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await new User(u).save();
        console.log(`Created user: ${u.email}`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    console.log('Seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedUsers();
