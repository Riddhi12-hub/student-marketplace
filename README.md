# 🎓 UniMarket — Student Marketplace Platform

A full-stack production-ready MERN application for students to buy and sell campus essentials — books, gadgets, notes, and more. Features real-time chat, fraud detection, recommendations, and a seller rating system.

---

## 📦 Project Structure

```
student-marketplace/
├── backend/
│   ├── config/
│   │   └── cloudinary.js           # Cloudinary image upload config
│   ├── controllers/
│   │   ├── authController.js       # Register, login, profile
│   │   ├── productController.js    # CRUD + fraud detection + recommendations
│   │   ├── chatController.js       # Conversations & messages
│   │   └── wishlistRatingController.js  # Wishlist + seller ratings
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect / optionalAuth
│   │   └── errorHandler.js        # Global error handler + AppError class
│   ├── models/
│   │   ├── User.js                 # User schema with ratings
│   │   ├── Product.js              # Product schema with fraud flags
│   │   ├── Message.js              # Conversation + Message schemas
│   │   └── WishlistRating.js       # Wishlist + Rating schemas
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── wishlistRoutes.js
│   │   ├── ratingRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   ├── socketHandler.js        # Socket.io event handlers
│   │   └── seedData.js             # Sample data seed script
│   ├── server.js                   # Entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Navbar.js       # Responsive nav with auth + notifications
    │   │   │   └── Spinner.js      # Spinner, EmptyState, StarRating, SkeletonCard
    │   │   ├── product/
    │   │   │   └── ProductCard.js  # Product grid card with wishlist
    │   │   └── chat/
    │   │       └── ChatWindow.js   # Real-time chat popup
    │   ├── context/
    │   │   ├── AuthContext.js      # Global auth state
    │   │   └── SocketContext.js    # Socket.io connection + events
    │   ├── pages/
    │   │   ├── Home.js             # Landing with hero + categories
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── ProductList.js      # Browse with search & filters
    │   │   ├── ProductDetail.js    # Full product view + chat + ratings
    │   │   ├── CreateProduct.js    # New listing form
    │   │   ├── EditProduct.js      # Edit listing form
    │   │   ├── Dashboard.js        # User dashboard
    │   │   ├── Wishlist.js         # Saved products
    │   │   ├── Profile.js          # Edit profile + password
    │   │   ├── SellerProfile.js    # Public seller page
    │   │   └── NotFound.js
    │   ├── utils/
    │   │   └── api.js              # Axios instance with interceptors
    │   ├── styles/
    │   │   └── index.css           # Tailwind + custom components
    │   └── App.js                  # Router + providers
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)

### Step 1 — Clone & Install

```bash
# Install backend dependencies
cd student-marketplace/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2 — Environment Variables

**Backend** — copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```

Fill in your values:
```env
PORT=5000
NODE_ENV=development

# MongoDB (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/student_marketplace

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:3000
```

**Frontend** — copy `.env.example` to `.env`:
```bash
cd frontend
cp .env.example .env
```

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Step 3 — Seed Database (optional but recommended)

```bash
cd backend
node utils/seedData.js
```

This creates 3 test users and 8 sample products.

**Demo credentials:**
| Email | Password |
|---|---|
| arjun@test.com | password123 |
| priya@test.com | password123 |
| rahul@test.com | password123 |

### Step 4 — Start Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev      # uses nodemon for hot reload

# Terminal 2 — Frontend
cd frontend
npm start
```

Visit: **http://localhost:3000**

---

## 🌐 API Endpoints Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login & get JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update profile + avatar |
| PUT | `/api/auth/change-password` | ✅ | Change password |
| GET | `/api/auth/user/:id` | No | Get public profile |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | No | Get all (search, filter, paginate) |
| GET | `/api/products/:id` | Optional | Get single product |
| POST | `/api/products` | ✅ | Create listing (multipart) |
| PUT | `/api/products/:id` | ✅ | Update listing |
| DELETE | `/api/products/:id` | ✅ | Delete listing |
| PUT | `/api/products/:id/sold` | ✅ | Mark as sold |
| GET | `/api/products/my/listings` | ✅ | My listings |
| GET | `/api/products/recommendations` | Optional | Recommended products |
| GET | `/api/products/seller/:sellerId` | No | Seller's products |

**Query params for GET /products:**
```
search, category, minPrice, maxPrice, location, condition,
isSold, sort (-createdAt|createdAt|price|-price|-views),
page, limit
```

### Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat/conversation` | ✅ | Get or create conversation |
| GET | `/api/chat/conversations` | ✅ | All user conversations |
| GET | `/api/chat/messages/:convId` | ✅ | Messages in conversation |
| POST | `/api/chat/messages` | ✅ | Send message (REST fallback) |
| GET | `/api/chat/unread-count` | ✅ | Total unread count |

### Wishlist
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist` | ✅ | Get user's wishlist |
| POST | `/api/wishlist/:productId` | ✅ | Add to wishlist |
| DELETE | `/api/wishlist/:productId` | ✅ | Remove from wishlist |
| GET | `/api/wishlist/check/:productId` | ✅ | Check if wishlisted |

### Ratings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ratings` | ✅ | Rate a seller |
| GET | `/api/ratings/seller/:sellerId` | No | Get seller ratings |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/dashboard` | ✅ | Dashboard stats |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `joinConversation` | `conversationId` | Join chat room |
| `leaveConversation` | `conversationId` | Leave chat room |
| `sendMessage` | `{ conversationId, content }` | Send a message |
| `typing` | `{ conversationId, isTyping }` | Typing indicator |
| `markRead` | `conversationId` | Mark messages as read |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `newMessage` | message object | New message received |
| `userTyping` | `{ userId, name, isTyping }` | Typing status |
| `messagesRead` | `{ conversationId, readBy }` | Read receipts |
| `messageNotification` | `{ sender, preview }` | Push notification |
| `userOnline` | `{ userId }` | User came online |
| `userOffline` | `{ userId }` | User went offline |

---

## ⚙️ Features Detail

### 🔐 Authentication
- JWT tokens stored in localStorage
- Protected routes on both frontend and backend
- Auto-logout on token expiry
- bcrypt password hashing (12 salt rounds)

### 📦 Product CRUD
- Multi-image upload via Cloudinary (up to 5 images per listing)
- Auto-image optimization (800x600 max, auto quality)
- Full text search with MongoDB text indexes
- Filter by category, price range, location, condition
- Pagination with configurable page size
- View count tracking

### 💬 Real-Time Chat
- Socket.io with JWT authentication on socket connection
- Room-based architecture (one room per conversation)
- Typing indicators with debounce
- Read receipts
- Unread message counts
- Offline message support via REST fallback

### ❤️ Wishlist
- Save/unsave products with one click
- Unique constraint (can't save same product twice)
- Auto-removes deleted products

### ⭐ Seller Rating System
- 1-5 star ratings with optional comment
- One rating per buyer per product
- Real-time average recalculation
- "Trusted Seller" badge awarded at ≥4.0 avg with ≥3 ratings

### 🤖 Recommendations
- Based on user's viewed categories (tracked per session)
- Falls back to popular products when insufficient history
- Excludes current product and sold items

### 🚨 Fraud Detection
- **Duplicate Listings:** Flags if same title listed by same seller within 24 hours
- **Unrealistic Pricing:** Per-category price limits (configurable in productController.js)
- Flagged listings hidden from main browse (but accessible to seller)
- Warning shown to seller on create/edit

### ✅ Mark as Sold
- Seller marks item as sold from product detail or dashboard
- Sold badge overlaid on product image
- Chat button replaced with "Sold" notice
- Sold items tracked in dashboard

---

## 🎨 Design System

Built with Tailwind CSS + custom design tokens:

- **Font:** Plus Jakarta Sans (body) + Syne (headings)
- **Primary:** Indigo `#6366f1`
- **Accent:** Orange `#f97316`
- **Animations:** fadeIn, slideUp, shimmer skeleton loaders
- **Components:** `.btn-primary`, `.btn-secondary`, `.card`, `.input`, `.badge-*`

---

## 🚀 Deployment

### Backend (Railway / Render / Heroku)
```bash
# Set environment variables in your platform dashboard
# Point MONGODB_URI to MongoDB Atlas
# Set NODE_ENV=production
npm start
```

### Frontend (Vercel / Netlify)
```bash
# Build
cd frontend && npm run build

# Set environment variables:
# REACT_APP_API_URL=https://your-backend.railway.app/api
# REACT_APP_SOCKET_URL=https://your-backend.railway.app
```

---

## 🧪 Sample API Test (curl)

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@test.com","password":"password123"}'

# Get products
curl http://localhost:5000/api/products?category=Books&sort=-createdAt

# Health check
curl http://localhost:5000/api/health
```

---

## 📝 License

MIT — Free for personal and commercial use.

---

Built with ❤️ as a production-ready MERN stack reference project.
