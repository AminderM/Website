# Authentication Backend Specification

**For**: Integra AI TMS Website
**Database**: MongoDB
**Frontend Base URL**: `https://api.staging.integratedtech.ca`

---

## Overview

The frontend requires 3 authentication endpoints to enable user signup, login, and protected routes (BOL Generator).

---

## 1. POST /api/auth/signup

**Create a new user account**

### Request
```json
{
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Response (Success - 200)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "tier": "free",
    "created_at": "2026-03-21T10:30:00Z"
  }
}
```

### Response (Error - 400/409)
```json
{
  "error": "Email already exists"
  // or "Invalid email format"
  // or "Password must be at least 6 characters"
}
```

### Implementation Steps
1. Validate email format (must be valid email)
2. Validate password (minimum 6 characters)
3. Check if email already exists in MongoDB
4. Hash password (use `bcryptjs` or similar)
5. Create user document in MongoDB with:
   - `email` (unique index)
   - `passwordHash` (hashed)
   - `name` (optional)
   - `tier` (default: "free")
   - `created_at` (current timestamp)
6. Generate JWT token (see Token Generation below)
7. Return token + user object

---

## 2. POST /api/auth/login

**Authenticate user and return token**

### Request
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Response (Success - 200)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "tier": "free",
    "created_at": "2026-03-21T10:30:00Z"
  }
}
```

### Response (Error - 401)
```json
{
  "error": "Invalid email or password"
}
```

### Implementation Steps
1. Validate email + password provided
2. Find user by email in MongoDB
3. Compare password with hash using bcrypt `.compare()`
4. If no match → return 401 error
5. If match → generate JWT token
6. Return token + user object

---

## 3. GET /api/auth/user

**Verify token and return user info (Protected)**

### Request Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response (Success - 200)
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "name": "John Doe",
  "tier": "free",
  "created_at": "2026-03-21T10:30:00Z"
}
```

### Response (Error - 401)
```json
{
  "error": "Unauthorized - invalid or expired token"
}
```

### Implementation Steps
1. Extract Bearer token from `Authorization` header
2. Verify JWT token signature (must match your JWT secret)
3. If invalid/expired → return 401
4. If valid → extract user ID from token payload
5. Fetch user from MongoDB by ID
6. Return user object

---

## JWT Token Generation

Use a library like `jsonwebtoken` (npm package)

### Token Payload (Suggested)
```javascript
const payload = {
  userId: user._id,
  email: user.email,
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

const token = jwt.sign(payload, process.env.JWT_SECRET, {
  algorithm: 'HS256'
});
```

### Environment Variables
```
JWT_SECRET=your-super-secret-key-change-in-production
MONGODB_URI=mongodb://localhost:27017/integra-ai
NODE_ENV=production
```

---

## MongoDB User Schema

```javascript
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: false
  },
  tier: {
    type: String,
    enum: ['free', 'paid'],
    default: 'free'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create unique index on email
userSchema.index({ email: 1 }, { unique: true });
```

---

## Example Node.js/Express Implementation

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // MongoDB model
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7); // Remove 'Bearer '
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      name: name || '',
      tier: 'free'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/user (Protected)
router.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      created_at: user.created_at
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
```

---

## Setup Instructions for Backend Team

1. **Install dependencies**:
   ```bash
   npm install jsonwebtoken bcryptjs mongoose
   ```

2. **Create User model** in `models/User.js` (see MongoDB schema above)

3. **Register auth routes** in main Express app:
   ```javascript
   const authRoutes = require('./routes/auth');
   app.use('/api/auth', authRoutes);
   ```

4. **Set environment variables**:
   ```
   JWT_SECRET=your-secret-key-here
   MONGODB_URI=your-mongodb-connection-string
   ```

5. **Enable CORS** (if frontend is on different origin):
   ```javascript
   const cors = require('cors');
   app.use(cors({
     origin: ['http://localhost:3000', 'https://yoursite.com'],
     credentials: true
   }));
   ```

6. **Test endpoints** with Postman or curl:
   ```bash
   # Signup
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'

   # Get User (replace TOKEN with actual token)
   curl -X GET http://localhost:3000/api/auth/user \
     -H "Authorization: Bearer TOKEN"
   ```

---

## Testing Checklist

- [ ] Signup with valid email/password → returns token + user
- [ ] Signup with duplicate email → returns 409 error
- [ ] Signup with short password → returns 400 error
- [ ] Login with correct credentials → returns token + user
- [ ] Login with wrong password → returns 401 error
- [ ] GET /api/auth/user with valid token → returns user info
- [ ] GET /api/auth/user with invalid token → returns 401 error
- [ ] GET /api/auth/user without token → returns 401 error
- [ ] Token expiration works (24 hours)

---

## Frontend Expectations

The frontend (React) is ready to:
- POST to `/api/auth/signup` → expects `{ token, user }`
- POST to `/api/auth/login` → expects `{ token, user }`
- GET `/api/auth/user` with `Authorization: Bearer {token}` header → expects user object
- Store token in localStorage with key `auth-token`
- Auto-verify token on app load
- Show BOL Generator only to authenticated users

No changes needed on the frontend once these endpoints are live! 🎉
