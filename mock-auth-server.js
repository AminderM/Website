const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory user storage (for demo purposes)
const users = {};

// JWT Secret (same for both frontend and backend)
const JWT_SECRET = 'your-secret-key-change-in-production';

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
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Helper function to generate JWT
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// ============================================
// POST /api/auth/signup
// ============================================
app.post('/api/auth/signup', (req, res) => {
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
    if (users[email]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    users[email] = {
      id: userId,
      email: email.toLowerCase(),
      password, // In production, this would be hashed!
      name: name || '',
      tier: 'free',
      created_at: new Date().toISOString()
    };

    // Generate token
    const token = generateToken(userId, email);

    res.status(200).json({
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: users[email].name,
        tier: 'free',
        created_at: users[email].created_at
      }
    });

    console.log(`✅ User signed up: ${email}`);
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ============================================
// POST /api/auth/login
// ============================================
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = users[email];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password (in production, use bcrypt!)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        created_at: user.created_at
      }
    });

    console.log(`✅ User logged in: ${email}`);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// GET /api/auth/user (Protected)
// ============================================
app.get('/api/auth/user', verifyToken, (req, res) => {
  try {
    const user = users[req.userEmail];
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      created_at: user.created_at
    });

    console.log(`✅ User verified: ${req.userEmail}`);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================
// Health check endpoint
// ============================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Mock Auth Server Running ✅' });
});

// ============================================
// Start server
// ============================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🚀 MOCK AUTH SERVER STARTED                          ║
╠════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                           ║
║  Endpoint: http://localhost:${PORT}                      ║
║                                                        ║
║  📍 API Routes:                                        ║
║  POST   /api/auth/signup  - Create account            ║
║  POST   /api/auth/login   - Login user                ║
║  GET    /api/auth/user    - Get user (protected)      ║
║  GET    /api/health       - Health check              ║
║                                                        ║
║  ⚠️  WARNING: FOR TESTING ONLY!                       ║
║  - Passwords stored in plaintext (not hashed)        ║
║  - Users stored in memory (not persistent)           ║
║  - JWT secret hardcoded                              ║
║  - No database (in-memory storage)                   ║
║                                                        ║
║  📋 To replace with real backend:                     ║
║  Update REACT_APP_BACKEND_URL in .env file           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
