import express from 'express';
import jwt from 'jsonwebtoken';
import { createUser, validateUser } from '../services/userService';
import { getAllTenants } from '../services/tenantService';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_secret';
const TOKEN_EXPIRY = '8h';

router.post('/register', async (req, res) => {
  try {
    const { businessId, email, password } = req.body;
    if (!businessId || !email || !password) {
      return res.status(400).json({ error: 'businessId, email, password required' });
    }
    // Validate business exists
    const tenant = getAllTenants().find(t => t.id === businessId);
    if (!tenant) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const user = await createUser(businessId, email, password);
    const token = jwt.sign({ sub: user.id, businessId: user.businessId, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.status(201).json({ token, businessId: user.businessId, email: user.email });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const user = await validateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user.id, businessId: user.businessId, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, businessId: user.businessId, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Stripe-linked registration (requires tenant already has stripeAccountId)
router.post('/stripe/register', async (req, res) => {
  try {
    const { businessId, email, password } = req.body;
    if (!businessId || !email || !password) {
      return res.status(400).json({ error: 'businessId, email, password required' });
    }
    const tenant = getAllTenants().find(t => t.id === businessId);
    if (!tenant) return res.status(404).json({ error: 'Business not found' });
    if (!tenant.stripeAccountId) return res.status(400).json({ error: 'Business not linked to Stripe yet' });
    const user = await createUser(businessId, email, password, tenant.stripeAccountId);
    const token = jwt.sign({ sub: user.id, businessId: user.businessId, email: user.email, stripeAccountId: tenant.stripeAccountId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.status(201).json({ token, businessId: user.businessId, email: user.email, stripeAccountId: tenant.stripeAccountId });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Stripe-linked login (verifies user + tenant stripe association)
router.post('/stripe/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await validateUser(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const tenant = getAllTenants().find(t => t.id === user.businessId);
    if (!tenant || !tenant.stripeAccountId || tenant.stripeAccountId !== user.stripeAccountId) {
      return res.status(403).json({ error: 'Stripe account mismatch' });
    }
    const token = jwt.sign({ sub: user.id, businessId: user.businessId, email: user.email, stripeAccountId: tenant.stripeAccountId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, businessId: user.businessId, email: user.email, stripeAccountId: tenant.stripeAccountId });
  } catch (err) {
    res.status(500).json({ error: 'Stripe login failed' });
  }
});

export default router;