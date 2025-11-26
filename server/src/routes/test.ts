import express from 'express';

const router = express.Router();

// Mock SMS storage to simulate SMS responses
const mockSmsResponses: Array<{ to: string; message: string; timestamp: Date }> = [];

import { parseOrder } from '../services/orderParser';
import { getTenantByPhone, checkInventory } from '../services/tenantService';
import { createOrder } from '../services/orderService';

// Test endpoint to simulate sending an SMS order
router.post('/sms', (req, res) => {
  const { message, customerPhone, businessPhone } = req.body;

  if (!message || !customerPhone || !businessPhone) {
    return res.status(400).json({ 
      error: 'Missing required fields: message, customerPhone, businessPhone' 
    });
  }

  console.log(`\n📱 Simulating SMS from ${customerPhone} to ${businessPhone}`);
  console.log(`Message: "${message}"\n`);

  // Find the tenant/business by phone number
  const tenant = getTenantByPhone(businessPhone);
  if (!tenant) {
    const errorMsg = `No business found for phone: ${businessPhone}`;
    return res.json({
      success: false,
      error: errorMsg,
      smsResponse: errorMsg
    });
  }

  // Parse the order with tenant's menu
  const parsedOrder = parseOrder(message, tenant.menu);

  if (!parsedOrder.isValid) {
    const smsResponse = parsedOrder.errorMessage || 
      "Sorry, I couldn't understand your order. Please text 'menu' for options.";
    
    return res.json({
      success: false,
      parsedOrder,
      smsResponse
    });
  }

  // Check inventory for all items
  const inventoryIssues: string[] = [];
  const stockWarnings: string[] = [];
  
  for (const item of parsedOrder.items) {
    const { available, inStock } = checkInventory(businessPhone, item.name, item.quantity);
    
    if (!available) {
      if (inStock === 0) {
        inventoryIssues.push(`❌ ${item.name} is SOLD OUT`);
      } else {
        inventoryIssues.push(`❌ ${item.name}: Only ${inStock} left (you ordered ${item.quantity})`);
      }
    } else if (inStock <= 5 && inStock > 0) {
      stockWarnings.push(`⚠️ ${item.name}: Only ${inStock} left in stock`);
    }
  }

  if (inventoryIssues.length > 0) {
    let smsResponse = "Sorry, we can't fulfill your order:\n\n" + inventoryIssues.join('\n');
    if (stockWarnings.length > 0) {
      smsResponse += '\n\n' + stockWarnings.join('\n');
    }
    smsResponse += '\n\nPlease adjust your order and try again.';
    
    return res.json({
      success: false,
      inventoryIssues,
      stockWarnings,
      smsResponse
    });
  }

  // Generate order ID and store order
  const orderId = Date.now().toString();
  createOrder(orderId, {
    id: orderId,
    customerPhone,
    businessPhone,
    tenant,
    items: parsedOrder.items,
    total: parsedOrder.total,
    customerName: parsedOrder.customerName,
    tableNumber: parsedOrder.tableNumber,
    status: 'awaiting_payment',
    createdAt: new Date(),
    stripeAccountId: tenant.stripeAccountId
  });

  // Format response
  const itemsList = parsedOrder.items
    .map(item => {
      const mods = item.modifications ? ` (${item.modifications.join(', ')})` : '';
      return `${item.quantity}x ${item.name}${mods} ($${(item.price * item.quantity).toFixed(2)})`;
    })
    .join('\n');

  const paymentLink = `http://localhost:3000/pay/${orderId}`;
  const stockInfo = stockWarnings.length > 0 ? '\n\n' + stockWarnings.join('\n') + '\n' : '';
  
  const smsResponse = parsedOrder.hasFuzzyMatches 
    ? `✓ I understood your order as:\n\n${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nIf this looks correct, pay now:\n${paymentLink}`
    : `Order ready for payment:\n\n${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nPay now:\n${paymentLink}`;

  res.json({
    success: true,
    parsedOrder,
    orderId,
    paymentLink,
    smsResponse
  });
});

// SMS log endpoints - now handled on frontend
router.get('/sms-log', (req, res) => {
  res.json({ message: 'SMS logging moved to frontend' });
});

router.delete('/sms-log', (req, res) => {
  res.json({ message: 'SMS logging moved to frontend' });
});

export default router;
