import bcrypt from 'bcryptjs';
import { db } from '../models/db.js';
import { generateToken } from '../middleware/authMiddleware.js';

export async function register(req, res) {
  try {
    const { name, email, phone, password, role = 'CITIZEN', department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.users.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      role: role.toUpperCase(),
      phone: phone || '',
      department: department || null,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      created_at: new Date().toISOString()
    };

    db.users.insert(newUser);

    const token = generateToken(newUser);
    const { password_hash: _, ...safeUser } = newUser;

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password_hash: _, ...safeUser } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function getMe(req, res) {
  const { password_hash: _, ...safeUser } = req.user;
  return res.json({ user: safeUser });
}

export async function getWorkers(req, res) {
  const { department } = req.query;
  const workers = db.users.listWorkers(department);
  const safeWorkers = workers.map(({ password_hash, ...u }) => u);
  return res.json({ workers: safeWorkers });
}

export async function demoLogin(req, res) {
  try {
    const { role = 'CITIZEN' } = req.body;
    const { users } = db.get();
    const targetUser = users.find((u) => u.role === role.toUpperCase()) || users[0];

    if (!targetUser) {
      return res.status(404).json({ error: 'Demo user for role not found' });
    }

    const token = generateToken(targetUser);
    const { password_hash: _, ...safeUser } = targetUser;

    return res.json({
      message: `Logged in as demo ${targetUser.role}`,
      token,
      user: safeUser
    });
  } catch (err) {
    return res.status(500).json({ error: 'Demo login failed' });
  }
}
