import { Router } from 'express';
import { getAllTenants } from '../services/tenantService';

const router = Router();

// Get public business info for ordering portal (mock data only)
router.get('/:businessId/public', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const tenants = await getAllTenants();
    const business = tenants.find(t => t.id === businessId);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      id: business.id,
      businessName: business.businessName,
      menu: business.menu,
    });
  } catch (error) {
    console.error('Error getting business info:', error);
    res.status(500).json({ error: 'Failed to get business information' });
  }
});

export default router;