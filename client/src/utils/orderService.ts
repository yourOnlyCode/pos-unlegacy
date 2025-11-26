const orders = new Map<string, any>();

export function getOrder(orderId: string): any | null {
  return orders.get(orderId) || null;
}

export function createOrder(orderId: string, orderData: any): void {
  orders.set(orderId, orderData);
}