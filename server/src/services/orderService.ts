import { prisma } from '../lib/prisma';

export async function getOrder(orderId: string): Promise<any | null> {
  console.log(`[orderService.getOrder] Looking for order: ${orderId}`);
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { business: true }
    });
    
    console.log(`[orderService.getOrder] Found:`, order ? 'YES' : 'NO');
    return order;
  } catch (error) {
    console.error(`[orderService.getOrder] Error:`, error);
    return null;
  }
}

export async function createOrder(orderId: string, orderData: any): Promise<void> {
  console.log(`[orderService.createOrder] Creating order: ${orderId}`);
  
  await prisma.order.create({
    data: {
      id: orderId,
      businessId: orderData.businessId,
      customerPhone: orderData.customerPhone,
      customerName: orderData.customerName,
      tableNumber: orderData.tableNumber,
      items: orderData.items,
      total: orderData.total,
      status: orderData.status || 'paid',
      stripePaymentIntentId: orderData.stripePaymentIntentId
    }
  });
  
  console.log(`[orderService.createOrder] Order created successfully`);
}

export async function updateOrder(orderId: string, updates: any): Promise<boolean> {
  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { business: true }
    });
    
    if (!existingOrder) return false;
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...updates,
        completedAt: updates.status === 'completed' ? new Date() : existingOrder.completedAt
      },
      include: { business: true }
    });
    
    // Send SMS notification if order is marked complete
    if (updates.status === 'complete' && existingOrder.status !== 'complete') {
      notifyOrderComplete(updatedOrder);
    }
    
    return true;
  } catch (error) {
    console.error(`[orderService.updateOrder] Error:`, error);
    return false;
  }
}

async function notifyOrderComplete(order: any): Promise<void> {
  try {
    const { sendSMS } = require('./smsService');
    const message = `Your order from ${order.tenant.businessName} is ready for pickup! Order: ${order.items.map((i: any) => {
      const mods = i.modifications ? ` (${i.modifications.join(', ')})` : '';
      return `${i.quantity}x ${i.name}${mods}`;
    }).join(', ')}`;
    
    await sendSMS(order.businessPhone, order.customerPhone, message);
    console.log(`Order completion SMS sent for order ${order.id}`);
  } catch (error) {
    console.error('Failed to send order completion SMS:', error);
  }
}

export async function getAllOrders(): Promise<any[]> {
  try {
    const orders = await prisma.order.findMany({
      include: { business: true },
      orderBy: { createdAt: 'desc' }
    });
    return orders;
  } catch (error) {
    console.error(`[orderService.getAllOrders] Error:`, error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  return updateOrder(orderId, { status });
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    await prisma.order.delete({
      where: { id: orderId }
    });
    return true;
  } catch (error) {
    console.error(`[orderService.deleteOrder] Error:`, error);
    return false;
  }
}