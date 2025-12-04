import express from 'express';
import { requireAuth, requireBusinessMatch } from '../middleware/authMiddleware';
import { getTenantByPhone, getAllTenants, addTenant, updateTenant } from '../services/tenantService';
import { assignPhoneNumber, releasePhoneNumber, getPurchasedNumbers, getNumberByBusiness } from '../services/phonePoolService';
import { calculateCosts } from '../services/costTracker';


const router = express.Router();

// Get all tenants
router.get('/tenants', async (req, res) => {
  const tenants = await getAllTenants();
  res.json(tenants);
});

// Get tenant by phone
router.get('/tenants/:phone', async (req, res) => {
  const tenant = await getTenantByPhone(req.params.phone);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant);
});

// Add new tenant with auto-assigned phone number
router.post('/tenants', async (req, res) => {
  try {
    const { id, businessName, menu, settings, email, adminPassword, operationsPassword } = req.body;

    console.log('Creating tenant with data:', { id, businessName, email, menuItemCount: Object.keys(menu || {}).length });

    if (!id || !businessName || !email || !adminPassword || !operationsPassword) {
      console.error('Missing required fields:', { id: !!id, businessName: !!businessName, email: !!email, adminPassword: !!adminPassword, operationsPassword: !!operationsPassword });
      return res.status(400).json({ error: 'Missing required fields (id, businessName, email, adminPassword, operationsPassword)' });
    }

    // Skip phone number assignment for now
    const phoneNumber = null;
    console.log('Skipping phone number assignment for business:', id);

    // Initialize inventory with default stock levels for each menu item
    const inventory: Record<string, number> = {};
    if (menu) {
      Object.keys(menu).forEach(itemName => {
        inventory[itemName] = 50; // Default stock of 50 for each item
      });
    }

    const tenant = {
      id,
      businessName,
      phoneNumber: phoneNumber || `temp-${id}`, // Temporary placeholder
      menu: menu || {},
      inventory,
      settings: settings || {
        currency: 'USD',
        timezone: 'America/New_York',
        autoReply: true
      }
    };

    await addTenant(tenant);
    console.log('Tenant added successfully:', id);

    // Auto-create admin and operations user accounts
    const { createUser } = require('../services/userService');
    try {
      await createUser(id, email, adminPassword, 'admin');
      console.log('Admin account created for:', email);

      await createUser(id, `ops-${email}`, operationsPassword, 'operations');
      console.log('Operations account created for:', `ops-${email}`);
    } catch (error) {
      console.error('Failed to create user accounts:', error);
    }

    // Return tenant info with next step for Stripe Connect
    res.status(201).json({
      phoneNumber: null, // No phone number assigned
      nextStep: {
        action: 'create_stripe_account',
        endpoint: '/api/connect/create-account',
        data: { businessId: id, businessName, email, phoneNumber: null }
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
router.put('/tenants/:phone', async (req, res) => {
  const success = await updateTenant(req.params.phone, req.body);
  if (!success) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const updatedTenant = await getTenantByPhone(req.params.phone);
  res.json(updatedTenant);
});

import { getAllOrders } from '../services/orderService';

// Get orders for a specific business
router.get('/business/:businessId/orders', requireAuth, requireBusinessMatch, async (req, res) => {
  try {
    const { businessId } = req.params;

    const allTenants = await getAllTenants();
    const business = allTenants.find(t => t.id === businessId);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const phoneNumber = business.phoneNumber;
    const allOrders = await getAllOrders();

    const businessOrders = allOrders.filter((order: any) =>
      order.businessPhone === phoneNumber
    );

    res.json({
      businessId,
      phoneNumber,
      orders: businessOrders,
      totalOrders: businessOrders.length,
      totalRevenue: businessOrders
        .filter((o: any) => o.status === 'paid' || o.status === 'complete')
        .reduce((sum: number, o: any) => sum + o.total, 0)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update menu for a business
router.put('/business/:businessId/menu', requireAuth, requireBusinessMatch, async (req, res) => {
  const { businessId } = req.params;
  const { menu } = req.body;

  // Find business by ID in tenants
  const allTenants = await getAllTenants();
  const business = allTenants.find(t => t.id === businessId);

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  const success = await updateTenant(business.phoneNumber, { menu });
  if (!success) {
    return res.status(500).json({ error: 'Failed to update menu' });
  }

  res.json({ success: true, menu });
});

// Get settings for a business
router.get('/business/:businessId/settings', requireAuth, requireBusinessMatch, async (req, res) => {
  try {
    const { businessId } = req.params;

    const allTenants = await getAllTenants();
    const business = allTenants.find(t => t.id === businessId);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      businessId,
      settings: business.settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings for a business
router.put('/business/:businessId/settings', requireAuth, requireBusinessMatch, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { settings } = req.body;

    const allTenants = await getAllTenants();
    const business = allTenants.find(t => t.id === businessId);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Merge settings
    const updatedSettings = {
      ...business.settings,
      ...settings
    };

    const success = await updateTenant(business.phoneNumber, { settings: updatedSettings });
    if (!success) {
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    res.json({
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Upload image for menu items (temporarily disabled)
router.post('/business/:businessId/upload-image', requireAuth, requireBusinessMatch, (req, res) => {
  res.status(501).json({ error: 'Image upload temporarily disabled' });
});

export default router;