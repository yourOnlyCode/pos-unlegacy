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
  try {
    const { id, businessName, menu, settings, email } = req.body;
    
    console.log('Creating tenant with data:', { id, businessName, email, menuItemCount: Object.keys(menu || {}).length });
    
    if (!id || !businessName || !menu || !email) {
      console.error('Missing required fields:', { id: !!id, businessName: !!businessName, menu: !!menu, email: !!email });
      return res.status(400).json({ error: 'Missing required fields (id, businessName, menu, email)' });
    }

    // Auto-assign phone number from pool
    console.log('Assigning phone number for business:', id);
    const phoneNumber = await assignPhoneNumber(id);
    if (!phoneNumber) {
      console.error('Failed to assign phone number for business:', id);
      return res.status(500).json({ error: 'No phone numbers available' });
    }

    console.log('Phone number assigned:', phoneNumber);

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
    console.log('Tenant added successfully:', id);
    
    // Return tenant info with next step for Stripe Connect
    res.status(201).json({
      phoneNumber: tenant.phoneNumber,
      nextStep: {
        action: 'create_stripe_account',
        endpoint: '/api/connect/create-account',
        data: { businessId: id, businessName, email, phoneNumber }
      }
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
  }
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