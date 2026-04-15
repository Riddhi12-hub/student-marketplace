/**
 * Seed Script — creates demo users + products for testing
 * Run: node utils/seedData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600',
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600',
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_marketplace');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({ email: { $in: ['arjun@test.com', 'priya@test.com', 'rahul@test.com'] } }),
    ]);

    // Create demo users
    const [arjun, priya, rahul] = await Promise.all([
      User.create({ name: 'Arjun Sharma', email: 'arjun@test.com', password: 'password123', college: 'IIT Delhi', location: 'Delhi', averageRating: 4.7, totalRatings: 12, isTrustedSeller: true }),
      User.create({ name: 'Priya Singh', email: 'priya@test.com', password: 'password123', college: 'DU North Campus', location: 'Delhi', averageRating: 4.2, totalRatings: 5 }),
      User.create({ name: 'Rahul Verma', email: 'rahul@test.com', password: 'password123', college: 'BITS Pilani', location: 'Rajasthan', averageRating: 3.8, totalRatings: 3 }),
    ]);
    console.log('✅ Created 3 demo users');

    // Delete old demo products
    await Product.deleteMany({ seller: { $in: [arjun._id, priya._id, rahul._id] } });

    const products = await Product.insertMany([
      { title: 'NCERT Physics Class 12', description: 'Complete NCERT Physics textbook for Class 12 board exams. All chapters intact, minimal highlighting. Perfect for JEE prep.', price: 150, originalPrice: 450, category: 'Books', condition: 'Like New', location: 'Delhi', seller: arjun._id, images: [{ url: DEMO_IMAGES[0], publicId: '' }], tags: ['ncert', 'physics', 'class12', 'jee'] },
      { title: 'HP Pavilion Laptop 15-inch', description: 'HP Pavilion laptop, Core i5 10th Gen, 8GB RAM, 512GB SSD. Runs perfectly, minor scratches on lid. Great for engineering students.', price: 32000, originalPrice: 55000, category: 'Electronics', condition: 'Good', location: 'Delhi', seller: arjun._id, images: [{ url: DEMO_IMAGES[2], publicId: '' }], tags: ['laptop', 'hp', 'i5', 'engineering'] },
      { title: 'Organic Chemistry by Morrison Boyd', description: 'Classic Organic Chemistry reference book by Morrison & Boyd. 7th edition, all pages intact. Essential for chemistry students.', price: 400, originalPrice: 1200, category: 'Books', condition: 'Good', location: 'Delhi', seller: priya._id, images: [{ url: DEMO_IMAGES[6], publicId: '' }], tags: ['chemistry', 'organic', 'morrison', 'boyd'] },
      { title: 'JBL Tune 510BT Wireless Headphones', description: 'JBL Tune 510BT Bluetooth headphones. 40hr battery life, excellent sound. Bought 6 months ago, barely used.', price: 1800, originalPrice: 3499, category: 'Gadgets', condition: 'Like New', location: 'Rajasthan', seller: rahul._id, images: [{ url: DEMO_IMAGES[3], publicId: '' }], tags: ['jbl', 'headphones', 'bluetooth', 'wireless'] },
      { title: 'Data Structures Notes (Handwritten)', description: 'Complete handwritten notes for Data Structures & Algorithms. Covers arrays, linked lists, trees, graphs, sorting algorithms. A4 size, 120 pages.', price: 200, originalPrice: 500, category: 'Notes & Study Material', condition: 'Good', location: 'Delhi', seller: priya._id, images: [{ url: DEMO_IMAGES[1], publicId: '' }], tags: ['dsa', 'notes', 'algorithms', 'handwritten'] },
      { title: 'Casio FX-991EX Scientific Calculator', description: 'Casio fx-991EX scientific calculator. Spreadsheet function, QR code. Perfect for engineering maths and statistics.', price: 900, originalPrice: 1595, category: 'Stationery', condition: 'Like New', location: 'Rajasthan', seller: rahul._id, images: [{ url: DEMO_IMAGES[7], publicId: '' }], tags: ['casio', 'calculator', 'scientific', 'engineering'] },
      { title: 'Dell UltraSharp 24" Monitor', description: 'Dell U2422H 24-inch IPS monitor, 1920x1200 resolution. USB-C connectivity. Perfect for coding, design work.', price: 14000, originalPrice: 28000, category: 'Electronics', condition: 'Good', location: 'Delhi', seller: arjun._id, images: [{ url: DEMO_IMAGES[4], publicId: '' }], tags: ['dell', 'monitor', 'ultrasharp', 'ips'] },
      { title: 'Raspberry Pi 4 Model B (4GB)', description: 'Raspberry Pi 4 Model B with 4GB RAM. Includes official case, power supply, and 32GB microSD. Great for IoT and embedded projects.', price: 5500, originalPrice: 8500, category: 'Lab Equipment', condition: 'Like New', location: 'Delhi', seller: priya._id, images: [{ url: DEMO_IMAGES[5], publicId: '' }], tags: ['raspberry pi', 'iot', 'embedded', 'linux'] },
    ]);

    console.log(`✅ Created ${products.length} demo products`);
    console.log('\n🎉 Seed complete! Demo accounts:');
    console.log('   arjun@test.com / password123 (Trusted Seller ⭐)');
    console.log('   priya@test.com / password123');
    console.log('   rahul@test.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
