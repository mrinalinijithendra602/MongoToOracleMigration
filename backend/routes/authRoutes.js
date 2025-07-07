import express from 'express';
import fernet from 'fernet';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

const router = express.Router();

const Secret = fernet.Secret;
const Token = fernet.Token;

// Replace this with your actual Fernet key
const SECRET = new Secret("G1NHIT32lef_hkn9y7r22_DBgFYinFWt6CqpJY-lVY4=");

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({ error: 'User not found' });
    }

    const encrypted = customer.encrypted_password;
    if (!encrypted) {
      return res.status(400).json({ error: 'Password missing in record' });
    }

    let decryptedPassword;
    try {
      const token = new Token({
        secret: SECRET,
        token: encrypted,
        ttl: 0,
      });
      decryptedPassword = token.decode();
    } catch (err) {
      return res.status(500).json({ error: 'Password decryption failed' });
    }

    if (decryptedPassword !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Store user in session
req.session.user = {
  id: customer.id,
  name: customer.customer_name,
  email: customer.email,
};

req.session.save(err => {
  if (err) {
    console.error('Session save error:', err);
    return res.status(500).json({ error: 'Failed to save session' });
  }
  res.json({
    message: 'Login successful',
    user: req.session.user,
  });
});


  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  // Send back the user info stored in session, including baskets with product SKUs
  res.json({ user: req.session.user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

export default router;
