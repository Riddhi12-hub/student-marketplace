/**
 * Student Marketplace Platform - Main Server
 * Entry point for the Express + Socket.io backend
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');

// Load environment variables FIRST
dotenv.config();

const passport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chatRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const userRoutes = require('./routes/userRoutes');

// Import socket handler
const socketHandler = require('./utils/socketHandler');

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app so controllers can access it
app.set('io', io);

// Initialize socket handler
socketHandler(io);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local uploads if Cloudinary is not configured
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session (only used as OAuth bridge - real auth uses JWT)
app.use(session({
  secret: process.env.SESSION_SECRET || 'student_marketplace_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }, // 1 min - just enough for OAuth handshake
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Student Marketplace API is running', timestamp: new Date() });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Database Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_marketplace');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = { app, server, io };
