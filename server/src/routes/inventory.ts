import express from 'express';
import { requireAuth, requireBusinessMatch } from '../middleware/authMiddleware';
import { getTenantByPhone, updateTenant, getAllTenants } from '../services/tenantService';
import { syncInventoryFromProvider, InventoryIntegration, IntegrationProvider } from '../services/inventoryIntegrationService';

const router = express.Router();

// Get integration config for a business
router.get('/business/:businessId/integration', requireAuth, requireBusinessMatch, (req, res) => {
  const { businessId } = req.params;
  const tenants = getAllTenants();
  const business = tenants.find(t => t.id === businessId);
  
  if (!business) return res.status(404).json({ error: 'Business not found' });
  
  const integration = (business as any).inventoryIntegration || {
    provider: 'manual',
    enabled: false
  };
  
  // Don't expose sensitive tokens in response
  res.json({
    provider: integration.provider,
    enabled: integration.enabled,
    lastSyncedAt: integration.lastSyncedAt,
    merchantId: integration.merchantId,
    locationId: integration.locationId,
    storeUrl: integration.storeUrl
  });
});

// Configure integration for a business
router.post('/business/:businessId/integration', requireAuth, requireBusinessMatch, async (req, res) => {
  const { businessId } = req.params;
  const { provider, accessToken, refreshToken, merchantId, locationId, apiKey, storeUrl, enabled } = req.body;
  
  if (!provider) return res.status(400).json({ error: 'Provider required' });
  
  const tenants = getAllTenants();
  const business = tenants.find(t => t.id === businessId);
  if (!business) return res.status(404).json({ error: 'Business not found' });
  
  const integration: InventoryIntegration = {
    provider: provider as IntegrationProvider,
    accessToken,
    refreshToken,
    merchantId,
    locationId,
    apiKey,
    storeUrl,
    enabled: enabled !== false,
    lastSyncedAt: undefined
  };
  
  updateTenant(business.phoneNumber, { inventoryIntegration: integration } as any);
  
  res.json({ success: true, provider, enabled: integration.enabled });
});

// Trigger manual sync
router.post('/business/:businessId/sync', requireAuth, requireBusinessMatch, async (req, res) => {
  const { businessId } = req.params;
  const tenants = getAllTenants();
  const business = tenants.find(t => t.id === businessId);
  
  if (!business) return res.status(404).json({ error: 'Business not found' });
  
  const integration = (business as any).inventoryIntegration as InventoryIntegration;
  if (!integration || !integration.enabled) {
    return res.status(400).json({ error: 'No integration configured or integration disabled' });
  }
  
  try {
    const items = await syncInventoryFromProvider(integration);
    
    // Update local menu and inventory
    const menu: Record<string, number> = {};
    const inventory: Record<string, number> = {};
    
    items.forEach(item => {
      const key = item.name.toLowerCase();
      menu[key] = item.price;
      inventory[key] = item.quantity;
    });
    
    updateTenant(business.phoneNumber, { 
      menu, 
      inventory,
      inventoryIntegration: { ...integration, lastSyncedAt: new Date() }
    } as any);
    
    res.json({ 
      success: true, 
      itemsCount: items.length, 
      syncedAt: new Date(),
      items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
    });
  } catch (error) {
    console.error('Sync failed:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// OAuth callback handlers (placeholder for future OAuth flow)
router.get('/oauth/square/callback', async (req, res) => {
  const { code, state } = req.query;
  // TODO: Exchange code for access token
  // TODO: Store tokens for business identified by state
  res.send('Square OAuth callback - implement token exchange');
});

router.get('/oauth/shopify/callback', async (req, res) => {
  const { code, shop, state } = req.query;
  // TODO: Exchange code for access token
  // TODO: Store tokens for business identified by state
  res.send('Shopify OAuth callback - implement token exchange');
});

router.get('/oauth/clover/callback', async (req, res) => {
  const { code, merchant_id, state } = req.query;
  // TODO: Exchange code for access token
  // TODO: Store tokens for business identified by state
  res.send('Clover OAuth callback - implement token exchange');
});

router.get('/oauth/toast/callback', async (req, res) => {
  const { code, state } = req.query;
  // TODO: Exchange code for access token
  // TODO: Store tokens for business identified by state
  res.send('Toast OAuth callback - implement token exchange');
});

export default router;
