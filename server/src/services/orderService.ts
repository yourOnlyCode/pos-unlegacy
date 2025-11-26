const orders = new Map<string, any>();

export function getOrder(orderId: string): any | null {
  return orders.get(orderId) || null;
}

export function createOrder(orderId: string, orderData: any): void {
  orders.set(orderId, orderData);
}

export function updateOrder(orderId: string, updates: any): boolean {
  const order = orders.get(orderId);
  if (!order) return false;
  
  const updatedOrder = { ...order, ...updates };
  orders.set(orderId, updatedOrder);
  
  // Send SMS notification if order is marked complete
  if (updates.status === 'complete' && order.status !== 'complete') {
    notifyOrderComplete(updatedOrder);
  }
  
  return true;
}

async function notifyOrderComplete(order: any): Promise<void> {
  try {
    const { sendSMS } = require('./smsService');
    const message = `Your order from ${order.tenant.businessName} is ready for pickup! Order: ${order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}`;
    
    await sendSMS(order.businessPhone, order.customerPhone, message);
    console.log(`Order completion SMS sent for order ${order.id}`);
  } catch (error) {
    console.error('Failed to send order completion SMS:', error);
  }
}

export function getAllOrders(): any[] {
  return Array.from(orders.values());
}

export function deleteOrder(orderId: string): boolean {
  return orders.delete(orderId);
}