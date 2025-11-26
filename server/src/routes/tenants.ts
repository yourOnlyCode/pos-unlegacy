import express from 'express';
import { getTenantByPhone, checkInventory } from '../services/tenantService';

const router = express.Router();

router.get('/:phoneNumber', (req, res) => {
  const tenant = getTenantByPhone(req.params.phoneNumber);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant);
});

router.post('/:phoneNumber/inventory/check', (req, res) => {
  const { items } = req.body;
  const results = items.map((item: { name: string; quantity: number }) => ({
    ...item,
    ...checkInventory(req.params.phoneNumber, item.name, item.quantity)
  }));
  res.json({ results });
});

export default router;