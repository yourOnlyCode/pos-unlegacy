import express from 'express';
import jwt from 'jsonwebtoken';
import { createUser, validateUser } from '../services/userService';
import { getAllTenants } from '../services/tenantService';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_secret';
const TOKEN_EXPIRY = '8h';

router.post('/register', async (req, res) => {
  try {
    const { businessId, email, password, role } = req.body;
    if (!businessId || !email || !password) {
      return res.status(400).json({ error: 'businessId, email, password required' });
    }
    // Validate business exists
    const tenant = getAllTenants().find(t => t.id === businessId);
    if (!tenant) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const user = await createUser(businessId, email, password, role || 'admin');
    const token = jwt.sign({ sub: user.id, businessId: user.businessId, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.status(201).json({ token, businessId: user.businessId, email: user.email, role: user.role });
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
    const token = jwt.sign({ sub: user.id, businessId: user.businessId, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, businessId: user.businessId, email: user.email, role: user.role });
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
    const user = await createUser(businessId, email, password, 'admin', tenant.stripeAccountId);
    const token = jwt.sign({ sub: user.id, businessId: user.businessId, email: user.email, role: user.role, stripeAccountId: tenant.stripeAccountId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.status(201).json({ token, businessId: user.businessId, email: user.email, role: user.role, stripeAccountId: tenant.stripeAccountId });
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
    const token = jwt.sign({ sub: user.id, businessId: user.businessId, email: user.email, role: user.role, stripeAccountId: tenant.stripeAccountId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, businessId: user.businessId, email: user.email, role: user.role, stripeAccountId: tenant.stripeAccountId });
  } catch (err) {
    res.status(500).json({ error: 'Stripe login failed' });
  }
});

// Test admin login (development only). Issues a token for an existing business without credentials.
router.post('/test-login', (req, res) => {
  const allow = process.env.NODE_ENV !== 'production' || process.env.TEST_MODE === 'true';
  if (!allow) return res.status(403).json({ error: 'Test login disabled in production' });
  const { businessId } = req.body;
  const tenants = getAllTenants();
  const target = businessId ? tenants.find(t => t.id === businessId) : tenants[0];
  if (!target) return res.status(404).json({ error: 'No tenant available for test login' });
  const payload = {
    sub: 'test-admin',
    businessId: target.id,
    email: 'test-admin@demo.local',
    stripeAccountId: target.stripeAccountId,
    test: true
  } as any;
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, businessId: target.id, email: payload.email, stripeAccountId: target.stripeAccountId, test: true });
});

export default router;