import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { OrderRoutingService } from '../services/orderRouting';
import { getAllTenants } from '../services/tenantService';

const router = Router();
const prisma = new PrismaClient();
const orderRouting = new OrderRoutingService();

// Get public business info for ordering portal
router.get('/:businessId/public', async (req, res) => {
  try {
    const { businessId } = req.params;

    // First try mock data from tenant service
    const tenants = await getAllTenants();
    const mockBusiness = tenants.find(t => t.id === businessId);

    if (mockBusiness) {
      return res.json({
        id: mockBusiness.id,
        businessName: mockBusiness.businessName,
        menu: mockBusiness.menu,
      });
    }

    // Fallback to database
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        businessName: true,
        menu: true,
      },
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    console.error('Error getting public business info:', error);
    res.status(500).json({ error: 'Failed to get business information' });
  }
});

// Get business configuration for frontend routing
router.get('/:businessId/config', async (req, res) => {
  try {
    const { businessId } = req.params;

    // Try mock data first
    const tenants = await getAllTenants();
    const mockBusiness = tenants.find(t => t.id === businessId);
    
    if (mockBusiness) {
      return res.json({
        deploymentType: 'cloud',
        edgeApiEndpoint: null,
        edgeDeviceId: null,
      });
    }

    const config = await orderRouting.getBusinessConfig(businessId);

    if (!config) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      deploymentType: config.deploymentType,
      edgeApiEndpoint: config.edgeApiEndpoint,
      edgeDeviceId: config.edgeDeviceId,
    });
  } catch (error) {
    console.error('Error getting business config:', error);
    res.status(500).json({ error: 'Failed to get business configuration' });
  }
});

export default router;