const orders = new Map<string, any>();

export function getOrder(orderId: string): any | null {
  console.log(`[orderService.getOrder] Looking for order: ${orderId}`);
  console.log(`[orderService.getOrder] Total orders in memory: ${orders.size}`);
  console.log(`[orderService.getOrder] Order IDs:`, Array.from(orders.keys()));
  const order = orders.get(orderId);
  console.log(`[orderService.getOrder] Found:`, order ? 'YES' : 'NO');
  return order || null;
}

export function createOrder(orderId: string, orderData: any): void {
  console.log(`[orderService.createOrder] Creating order: ${orderId}`);
  orders.set(orderId, orderData);
  console.log(`[orderService.createOrder] Total orders now: ${orders.size}`);
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

export function getAllOrders(): any[] {
  return Array.from(orders.values());
}

export function updateOrderStatus(orderId: string, status: string): boolean {
  return updateOrder(orderId, { status });
}

export function deleteOrder(orderId: string): boolean {
  return orders.delete(orderId);
}