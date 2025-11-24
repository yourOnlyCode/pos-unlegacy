// Shared order storage (in production, use database)
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
  
  orders.set(orderId, { ...order, ...updates });
  return true;
}

export function getAllOrders(): any[] {
  return Array.from(orders.values());
}

export function deleteOrder(orderId: string): boolean {
  return orders.delete(orderId);
}
