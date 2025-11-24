import express from 'express';
import { getTenantByPhone, getAllTenants, addTenant, updateTenant } from '../services/tenantService';
import { assignPhoneNumber, releasePhoneNumber, getPurchasedNumbers, getNumberByBusiness } from '../services/phonePoolService';
import { calculateCosts } from '../services/costTracker';

const router = express.Router();

// Get all tenants
router.get('/tenants', (req, res) => {
  const tenants = getAllTenants();
  res.json(tenants);
});

// Get tenant by phone
router.get('/tenants/:phone', (req, res) => {
  const tenant = getTenantByPhone(req.params.phone);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant);
});

// Add new tenant with auto-assigned phone number
router.post('/tenants', async (req, res) => {
  const { id, businessName, menu, settings } = req.body;
  
  if (!id || !businessName || !menu) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Auto-assign phone number from pool
  const phoneNumber = await assignPhoneNumber(id);
  if (!phoneNumber) {
    return res.status(500).json({ error: 'No phone numbers available' });
  }

  const tenant = {
    id,
    businessName,
    phoneNumber,
    menu,
    settings: settings || {
      currency: 'USD',
      timezone: 'America/New_York',
      autoReply: true
    }
  };

  addTenant(tenant);
  res.status(201).json(tenant);
});

// Get all purchased phone numbers with cost breakdown
router.get('/phone-numbers', (req, res) => {
  const costSummary = calculateCosts();
  res.json(costSummary);
});

// Get cost dashboard
router.get('/costs', (req, res) => {
  const costs = calculateCosts();
  res.json({
    summary: {
      totalNumbers: costs.totalNumbers,
      monthlyBill: `$${costs.monthlyCost.toFixed(2)}`,
      dailyCost: `$${costs.dailyCost.toFixed(2)}`,
      costPerBusiness: '$1.00/month'
    },
    businesses: costs.businesses
  });
});

// Cancel business and release phone number
router.delete('/tenants/:businessId', async (req, res) => {
  const { businessId } = req.params;
  const phoneNumber = getNumberByBusiness(businessId);
  
  if (!phoneNumber) {
    return res.status(404).json({ error: 'Business not found' });
  }
  
  const released = await releasePhoneNumber(businessId);
  if (released) {
    res.json({ 
      message: 'Business cancelled and phone number released',
      phoneNumber,
      monthlySavings: '$1.00'
    });
  } else {
    res.status(500).json({ error: 'Failed to release phone number' });
  }
});

// Update tenant
router.put('/tenants/:phone', (req, res) => {
  const success = updateTenant(req.params.phone, req.body);
  if (!success) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  const updatedTenant = getTenantByPhone(req.params.phone);
  res.json(updatedTenant);
});

export default router;