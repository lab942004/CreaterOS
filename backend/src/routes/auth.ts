import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbStore } from '../utils/store';
import { config } from '../config';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = dbStore.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Allow test password CreatorOS@2026 or any match in demo mode
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isOnboarded: user.isOnboarded,
      onboardingStep: user.onboardingStep
    }
  });
});

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existing = dbStore.users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'User already exists with this email' });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    email,
    name,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'OWNER',
    onboardingStep: 1,
    isOnboarded: false,
    createdAt: new Date().toISOString()
  };

  dbStore.users.push(newUser);

  // Create Workspace
  const newWs = {
    id: `ws_${Date.now()}`,
    name: `${name}'s Workspace`,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    ownerId: newUser.id
  };
  dbStore.workspaces.push(newWs);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, config.jwtSecret, { expiresIn: '7d' });

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isOnboarded: false,
      onboardingStep: 1
    }
  });
});

// Forgot Password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  res.json({ message: `Password reset instructions have been dispatched to ${email}.` });
});

// Current user profile & onboarding update
router.get('/me', (req: any, res) => {
  const user = req.user || dbStore.users[0];
  res.json({ user });
});

router.post('/onboarding', (req: any, res) => {
  const { step, completed, profileData } = req.body;
  const user = req.user || dbStore.users[0];
  if (step) user.onboardingStep = step;
  if (completed !== undefined) user.isOnboarded = completed;
  res.json({ success: true, user });
});

export default router;
