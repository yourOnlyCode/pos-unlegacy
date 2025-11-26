import { Router } from 'express';
import { OrderRoutingService } from '../services/orderRouting';

const router = Router();
const orderRouting = new OrderRoutingService();

// Get business configuration for frontend routing
router.get('/:businessId/config', async (req, res) => {
  try {
    const { businessId } = req.params;
    
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