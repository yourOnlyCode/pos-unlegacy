import { getOrder, updateOrder } from './orderService';
import { getTenantByPhone } from './tenantService';
import { sendSMS } from './smsService';

// Store active check-in timers
const checkInTimers = new Map<string, NodeJS.Timeout>();

// Store pending check-ins (orders awaiting customer confirmation)
const pendingCheckIns = new Set<string>();

export async function scheduleCheckIn(orderId: string): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) {
    console.log(`Cannot schedule check-in: Order ${orderId} not found`);
    return;
  }

  const tenant = await getTenantByPhone(order.businessPhone);
  if (!tenant) {
    console.log(`Cannot schedule check-in: Tenant not found for ${order.businessPhone}`);
    return;
  }

  // Check if check-in is enabled
  if (!tenant.settings.checkInEnabled || !tenant.settings.checkInTimerMinutes) {
    console.log(`Check-in disabled for ${tenant.businessName}`);
    return;
  }

  // Cancel existing timer if any
  cancelCheckIn(orderId);

  const delayMs = tenant.settings.checkInTimerMinutes * 60 * 1000;
  
  console.log(`Scheduling check-in for order ${orderId} in ${tenant.settings.checkInTimerMinutes} minutes`);

  const timer = setTimeout(async () => {
    await sendCheckInMessage(orderId);
  }, delayMs);

  checkInTimers.set(orderId, timer);
}

async function sendCheckInMessage(orderId: string): Promise<void> {
  try {
    const order = await getOrder(orderId);
    if (!order) {
      console.log(`Check-in skipped: Order ${orderId} not found`);
      return;
    }

    // Only send check-in if order is still in 'paid' or 'preparing' status
    if (order.status !== 'paid' && order.status !== 'preparing') {
      console.log(`Check-in skipped: Order ${orderId} status is ${order.status}`);
      return;
    }

    const tenant = await getTenantByPhone(order.businessPhone);
    if (!tenant) {
      console.log(`Check-in skipped: Tenant not found`);
      return;
    }

    const message = `Hi ${order.customerName || 'there'}! Did you receive your order from ${tenant.businessName}? Reply YES if everything is good, or let us know if there's an issue.`;

    await sendSMS(order.businessPhone, order.customerPhone, message);
    
    // Mark as pending check-in
    pendingCheckIns.add(order.customerPhone);
    
    console.log(`Check-in message sent for order ${orderId}`);
  } catch (error) {
    console.error(`Failed to send check-in message for order ${orderId}:`, error);
  }
}

export async function handleCheckInResponse(customerPhone: string, message: string): Promise<boolean> {
  // Check if this customer has a pending check-in
  if (!pendingCheckIns.has(customerPhone)) {
    return false; // Not a check-in response
  }

  const normalizedMessage = message.toLowerCase().trim();
  
  // Positive responses
  const positiveResponses = ['yes', 'yeah', 'yep', 'yup', 'sure', 'good', 'great', 'perfect', 'ok', 'okay', 'received', 'got it', 'thanks', 'thank you'];
  const isPositive = positiveResponses.some(response => normalizedMessage.includes(response));

  if (isPositive) {
    // Find the most recent paid order for this customer and mark as complete
    const { getAllOrders } = require('./orderService');
    const orders = await getAllOrders();
    
    const customerOrders = orders
      .filter((o: any) => o.customerPhone === customerPhone && (o.status === 'paid' || o.status === 'preparing'))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (customerOrders.length > 0) {
      const orderToComplete = customerOrders[0];
      await updateOrder(orderToComplete.id, { status: 'complete' });
      console.log(`Order ${orderToComplete.id} marked as complete via check-in confirmation`);
      
      // Remove from pending check-ins
      pendingCheckIns.delete(customerPhone);
      
      return true;
    }
  }

  // For negative responses or unclear responses, keep in pending state
  // Business can manually update the order status
  console.log(`Check-in response from ${customerPhone}: ${message}`);
  
  return true; // We handled it, even if we didn't complete the order
}

export function cancelCheckIn(orderId: string): void {
  const timer = checkInTimers.get(orderId);
  if (timer) {
    clearTimeout(timer);
    checkInTimers.delete(orderId);
    console.log(`Check-in timer cancelled for order ${orderId}`);
  }
}

export function cancelCustomerCheckIns(customerPhone: string): void {
  pendingCheckIns.delete(customerPhone);
}

export function isPendingCheckIn(customerPhone: string): boolean {
  return pendingCheckIns.has(customerPhone);
}
