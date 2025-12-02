import express from 'express';
import twilio from 'twilio';
import { parseOrder } from '../services/orderParser';
import { getTenantByPhone, checkInventory } from '../services/tenantService';
import { getOrder, createOrder, updateOrder } from '../services/orderService';
import { 
  getConversation, 
  createConversation, 
  updateConversation, 
  completeConversation 
} from '../services/conversationService';

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

  // Check if this is a check-in response
  const { handleCheckInResponse, isPendingCheckIn } = require('../services/checkInService');
  if (isPendingCheckIn(customerPhone)) {
    const handled = handleCheckInResponse(customerPhone, message);
    if (handled) {
      const responseMsg = message.toLowerCase().includes('yes') || message.toLowerCase().includes('good') || message.toLowerCase().includes('received')
        ? "Great! Thanks for confirming. We hope you enjoyed your order!"
        : "Thanks for your response. We'll look into this right away.";
      sendSMS(customerPhone, responseMsg);
      return res.status(200).send('OK');
    }
  }

  // Check if customer is in a conversation
  const existingConversation = getConversation(customerPhone);
  
  if (existingConversation) {
    // Handle conversation flow
    handleConversationStep(existingConversation, message, customerPhone, tenant, res);
    return;
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

  // Check if name is missing (table is optional)
  if (!parsedOrder.customerName) {
    // Start conversation to collect name
    createConversation(customerPhone, businessPhone, 'awaiting_info', message, parsedOrder);
    sendSMS(customerPhone, "What's your name?");
    return res.status(200).send('OK');
  }

  // Process complete order
  processCompleteOrder(parsedOrder, customerPhone, businessPhone, tenant, res);
});

// Handle multi-step conversation
function handleConversationStep(conversation: any, message: string, customerPhone: string, tenant: any, res: any) {
  if (conversation.stage === 'awaiting_info') {
    // Try to extract both name and table from the response
    const { parsedOrder } = conversation;
    let customerName = parsedOrder.customerName;
    let tableNumber = parsedOrder.tableNumber;
    
    // Parse the response for name and table
    // Look for patterns like "John Smith, table 5" or "Sarah, 12"
    const commaMatch = message.match(/^([^,]+),\s*(?:table\s*)?([\d]+)/i);
    if (commaMatch) {
      if (!customerName) customerName = commaMatch[1].trim();
      if (!tableNumber) tableNumber = commaMatch[2].trim();
    } else {
      // Try to extract table number if present
      const tableMatch = message.match(/(?:table\s*|#)?(\d+)/i);
      if (tableMatch && !tableNumber) {
        tableNumber = tableMatch[1];
        // Everything else is the name
        if (!customerName) {
          customerName = message.replace(/(?:table\s*|#)?\d+/i, '').trim();
        }
      } else if (!customerName) {
        // No table number found, treat as name only
        customerName = message.trim();
      }
    }
    
    // Update conversation
    conversation.parsedOrder.customerName = customerName;
    conversation.parsedOrder.tableNumber = tableNumber || 'N/A';
    
    // Process the complete order
    processCompleteOrder(
      conversation.parsedOrder,
      customerPhone,
      conversation.businessPhone,
      tenant,
      res
    );
    
    // Clear conversation
    completeConversation(customerPhone);
  }
}

// Process a complete order with all information
function processCompleteOrder(parsedOrder: any, customerPhone: string, businessPhone: string, tenant: any, res: any) {
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
    .map((item: any) => `${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})`)
    .join('\n');

  let response;
  if (!tenant.stripeAccountId) {
    response = `Sorry, ${tenant.businessName} hasn't completed their payment setup yet. Please try again later or call directly.`;
  } else {
    // Add stock warnings to message if any
    const stockInfo = stockWarnings.length > 0 ? '\n\n' + stockWarnings.join('\n') + '\n' : '';
    
    const customerInfo = `👤 ${parsedOrder.customerName} | Table #${parsedOrder.tableNumber}\n\n`;
    
    // Add verification note if fuzzy matching was used
    const verificationNote = parsedOrder.hasFuzzyMatches 
      ? `✓ I understood your order as:\n\n${customerInfo}${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nIf this looks correct, pay now:\n${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`
      : `Order ready for payment:\n\n${customerInfo}${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nPay now:\n${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`;
    
    response = verificationNote;
  }

  sendSMS(customerPhone, response);
  
  res.status(200).send('OK');
}

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
  console.log(`[GET /order/:id] Looking for order: ${req.params.id}`);
  const order = getOrder(req.params.id);
  console.log(`[GET /order/:id] Order found:`, order ? 'YES' : 'NO');
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