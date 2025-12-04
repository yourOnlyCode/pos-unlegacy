/**
 * Orders Controller
 * Thin controller layer that delegates to service layer
 */

import { Request, Response } from 'express';
import * as orderService from '../services/orderService';
import { logger } from '../lib/logger';

export async function getOrder(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.params;
    logger.order('fetch', orderId);

    const order = await orderService.getOrder(orderId);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    logger.error('Failed to fetch order', error, { orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const orderData = req.body;
    const orderId = Date.now().toString();

    logger.order('create', orderId, { businessId: orderData.businessId });

    await orderService.createOrder(orderId, orderData);

    res.status(201).json({ id: orderId, ...orderData });
  } catch (error) {
    logger.error('Failed to create order', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    logger.order('update_status', orderId, { status });

    const success = await orderService.updateOrderStatus(orderId, status);

    if (!success) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update order status', error, { orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

export async function getAllOrders(req: Request, res: Response): Promise<void> {
  try {
    const { businessId } = req.query;

    logger.info('Fetching all orders', { businessId });

    const orders = await orderService.getAllOrders();

    // Filter by business if specified
    const filtered = businessId
      ? orders.filter(o => o.businessId === businessId)
      : orders;

    res.json(filtered);
  } catch (error) {
    logger.error('Failed to fetch orders', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

export async function deleteOrder(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.params;

    logger.order('delete', orderId);

    const success = await orderService.deleteOrder(orderId);

    if (!success) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete order', error, { orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to delete order' });
  }
}
