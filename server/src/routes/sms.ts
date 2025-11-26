import express from 'express';
import twilio from 'twilio';
import { parseOrder } from '../services/orderParser';
import { getTenantByPhone, checkInventory } from '../services/tenantService';
import { getOrder, createOrder, updateOrder } from '../services/orderService';

const router = express.Router();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Webhook endpoint for incoming SMS
router.post('/webhook', (req, res) => {
  const { Body, From, To } = req.body;
  const customerPhone = From;
  const businessPhone = To;
  const message = Body;

  console.log(`SMS from ${customerPhone} to ${businessPhone}: ${message}`);

  // Find the tenant/business by phone number
  const tenant = getTenantByPhone(businessPhone);
  if (!tenant) {
    console.error(`No tenant found for phone: ${businessPhone}`);
    return res.status(200).send('OK');
  }

  // Parse the order with tenant's menu
  const parsedOrder = parseOrder(message, tenant.menu);

  if (!parsedOrder.isValid) {
    // Send detailed error message with format instructions
    const errorMsg = parsedOrder.errorMessage || 
      "Sorry, I couldn't understand your order. Please text 'menu' for options.";
    sendSMS(customerPhone, errorMsg);
    return res.status(200).send('OK');
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
      // Warn if running low
      stockWarnings.push(`⚠️ ${item.name}: Only ${inStock} left in stock`);
    }
  }

  // If any items are out of stock or insufficient, send error message
  if (inventoryIssues.length > 0) {
    let inventoryMsg = "Sorry, we can't fulfill your order:\n\n" + inventoryIssues.join('\n');
    if (stockWarnings.length > 0) {
      inventoryMsg += '\n\n' + stockWarnings.join('\n');
    }
    inventoryMsg += '\n\nPlease adjust your order and try again.';
    
    sendSMS(customerPhone, inventoryMsg);
    return res.status(200).send('OK');
  }

  // Generate order ID
  const orderId = Date.now().toString();
  
  // Store order as pending payment
  createOrder(orderId, {
    id: orderId,
    customerPhone,
    businessPhone: businessPhone,
    tenant: tenant,
    items: parsedOrder.items,
    total: parsedOrder.total,
    customerName: parsedOrder.customerName,
    tableNumber: parsedOrder.tableNumber,
    status: 'awaiting_payment',
    createdAt: new Date(),
    stripeAccountId: tenant.stripeAccountId
  });

  // Create payment link
  const paymentLink = `${process.env.BASE_URL || 'http://localhost:3000'}/pay/${orderId}`;

  // Format order summary
  const itemsList = parsedOrder.items
    .map(item => `${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})`)
    .join('\n');

  let response;
  if (!tenant.stripeAccountId) {
    response = `Sorry, ${tenant.businessName} hasn't completed their payment setup yet. Please try again later or call directly.`;
  } else {
    // Add stock warnings to message if any
    const stockInfo = stockWarnings.length > 0 ? '\n\n' + stockWarnings.join('\n') + '\n' : '';
    
    // Add verification note if fuzzy matching was used
    const verificationNote = parsedOrder.hasFuzzyMatches 
      ? `✓ I understood your order as:\n\n${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nIf this looks correct, pay now:\n${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`
      : `Order ready for payment:\n\n${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nPay now:\n${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`;
    
    response = verificationNote;
  }

  sendSMS(customerPhone, response);
  
  res.status(200).send('OK');
});

// Handle menu requests
router.post('/webhook', (req, res) => {
  const { Body, From } = req.body;
  
  if (Body.toLowerCase().includes('menu')) {
    const menuText = `Menu:\n☕ Coffee - $4.50\n🥪 Sandwich - $8.99\n🧁 Pastry - $3.25\n☕ Latte - $5.25\n☕ Cappuccino - $4.75\n🧁 Muffin - $2.99\n🥯 Bagel - $3.50\n\nText your order like: "2 coffee, 1 sandwich"`;
    
    sendSMS(From, menuText);
    return res.status(200).send('OK');
  }
});

// Get order details for payment page
router.get('/order/:id', (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Update order status after payment
router.post('/order/:id/paid', async (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  updateOrder(req.params.id, { status: 'paid' });
  
  // Forward to POS system if configured
  const { forwardOrderToPOS } = require('../services/posIntegrationService');
  if (order.tenant?.posIntegration) {
    const success = await forwardOrderToPOS(order, order.tenant.posIntegration);
    if (success) {
      console.log(`Order ${order.id} forwarded to ${order.tenant.posIntegration.provider}`);
    }
  }
  
  // Send confirmation SMS
  sendSMS(order.customerPhone, 
    `Payment received! Order #${order.id}`
  );
  
  res.json({ success: true });
});

async function sendSMS(to: string, message: string) {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log(`SMS sent to ${to}: ${message}`);
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}

export default router;