import express from 'express';
import { parseOrder } from '../services/orderParser';
import { getTenantByPhone, checkInventory } from '../services/tenantService';
import { createOrder } from '../services/orderService';

const router = express.Router();

// Mock SMS storage to simulate SMS responses
const mockSmsResponses: Array<{ to: string; message: string; timestamp: Date }> = [];

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
    mockSmsResponses.push({
      to: customerPhone,
      message: errorMsg,
      timestamp: new Date()
    });
    
    return res.json({
      success: false,
      error: errorMsg,
      smsResponse: errorMsg
    });
  }

  // Parse the order with tenant's menu
  const parsedOrder = parseOrder(message, tenant.menu);

  let smsResponse: string;

  if (!parsedOrder.isValid) {
    // Send error message
    smsResponse = parsedOrder.errorMessage || 
      "Sorry, I couldn't understand your order. Please text 'menu' for options.";
    
    mockSmsResponses.push({
      to: customerPhone,
      message: smsResponse,
      timestamp: new Date()
    });

    console.log(`❌ Order parsing failed`);
    console.log(`📤 SMS Response:\n${smsResponse}\n`);

    return res.json({
      success: false,
      parsedOrder,
      smsResponse,
      allResponses: mockSmsResponses
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
      // Warn if running low
      stockWarnings.push(`⚠️ ${item.name}: Only ${inStock} left in stock`);
    }
  }

  // If any items are out of stock or insufficient, send error message
  if (inventoryIssues.length > 0) {
    smsResponse = "Sorry, we can't fulfill your order:\n\n" + inventoryIssues.join('\n');
    if (stockWarnings.length > 0) {
      smsResponse += '\n\n' + stockWarnings.join('\n');
    }
    smsResponse += '\n\nPlease adjust your order and try again.';
    
    mockSmsResponses.push({
      to: customerPhone,
      message: smsResponse,
      timestamp: new Date()
    });

    console.log(`❌ Inventory check failed`);
    console.log(`📤 SMS Response:\n${smsResponse}\n`);

    return res.json({
      success: false,
      inventoryIssues,
      stockWarnings,
      smsResponse,
      allResponses: mockSmsResponses
    });
  }

  // Generate order ID
  const orderId = Date.now().toString();
  
  // Store order for payment page to access
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

  // Format order summary
  const itemsList = parsedOrder.items
    .map(item => `${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})`)
    .join('\n');

  // Create payment link
  const paymentLink = `http://localhost:3000/pay/${orderId}`;

  // Build response message
  if (!tenant.stripeAccountId) {
    smsResponse = `Sorry, ${tenant.businessName} hasn't completed their payment setup yet. Please try again later or call directly.`;
  } else {
    // Add stock warnings to message if any
    const stockInfo = stockWarnings.length > 0 ? '\n\n' + stockWarnings.join('\n') + '\n' : '';
    
    const verificationNote = parsedOrder.hasFuzzyMatches 
      ? `✓ I understood your order as:\n\n${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nIf this looks correct, pay now:\n${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`
      : `Order ready for payment:\n\n${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nPay now:\n${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`;
    
    smsResponse = verificationNote;
  }

  mockSmsResponses.push({
    to: customerPhone,
    message: smsResponse,
    timestamp: new Date()
  });

  console.log(`✅ Order parsed successfully`);
  console.log(`Customer: ${parsedOrder.customerName || 'Unknown'}`);
  console.log(`Table: ${parsedOrder.tableNumber || 'N/A'}`);
  console.log(`Items: ${parsedOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`);
  console.log(`Total: $${parsedOrder.total.toFixed(2)}`);
  console.log(`Fuzzy matching used: ${parsedOrder.hasFuzzyMatches ? 'Yes' : 'No'}`);
  console.log(`\n📤 SMS Response:\n${smsResponse}\n`);

  res.json({
    success: true,
    parsedOrder: {
      customerName: parsedOrder.customerName,
      tableNumber: parsedOrder.tableNumber,
      items: parsedOrder.items,
      total: parsedOrder.total,
      hasFuzzyMatches: parsedOrder.hasFuzzyMatches
    },
    orderId,
    paymentLink,
    smsResponse,
    allResponses: mockSmsResponses
  });
});

// Get all mock SMS responses
router.get('/sms-log', (req, res) => {
  res.json({
    messages: mockSmsResponses,
    count: mockSmsResponses.length
  });
});

// Clear mock SMS log
router.delete('/sms-log', (req, res) => {
  mockSmsResponses.length = 0;
  res.json({ message: 'SMS log cleared' });
});

export default router;
