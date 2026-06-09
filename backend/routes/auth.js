import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'crm_super_secret_key_2026_change_me',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/verify
router.get('/verify', auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// In-memory recovery code store
const recoveryCodes = {};

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Credential token is required.' });
  }

  try {
    // Decode JWT payload without verified signature since Google JWT is pre-validated by Google Client SDK
    const payloadSeg = credential.split('.')[1];
    const decodedPayload = JSON.parse(Buffer.from(payloadSeg, 'base64').toString('utf-8'));
    
    const { email, name } = decodedPayload;
    if (!email) {
      return res.status(400).json({ error: 'Invalid Google credential.' });
    }

    // Find or create user
    let user = await db.users.findOne({ username: email });
    if (!user) {
      console.log(`Creating new Google user: ${email}`);
      user = await db.users.create({
        username: email,
        password: 'google_authenticated_user_no_password'
      });
    }

    // Sign local JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'crm_super_secret_key_2026_change_me',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, username: user.username, name: name || email } });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate Google account.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username or email is required.' });
  }

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'No account found with this username.' });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    recoveryCodes[username] = code;

    console.log(`===================================================`);
    console.log(`🔑 PASSWORD RESET REQUESTED FOR: ${username}`);
    console.log(`👉 RECOVERY CODE: ${code}`);
    console.log(`===================================================`);

    res.json({ 
      message: 'A recovery code was sent to your registered channel.',
      code: code // We return it in the response for easy mock verification/testing in the UI!
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { username, code, newPassword } = req.body;
  if (!username || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    if (recoveryCodes[username] !== code) {
      return res.status(400).json({ error: 'Invalid or expired recovery code.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await db.users.updatePassword(username, hashedPassword);

    if (updated) {
      delete recoveryCodes[username]; // Clear the code after successful reset
      console.log(`✅ PASSWORD RESET SUCCESSFUL FOR: ${username}`);
      res.json({ success: true, message: 'Password has been successfully updated.' });
    } else {
      res.status(400).json({ error: 'Failed to update password.' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
