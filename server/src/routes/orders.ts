import express from 'express';
import { getOrder, updateOrder } from '../services/orderService';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Update order status
router.put('/:orderId/status', requireAuth, (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  const order = getOrder(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const success = updateOrder(orderId, { status });
  if (!success) {
    return res.status(500).json({ error: 'Failed to update order' });
  }
  
  res.json({ success: true, orderId, status });
});

export default router;