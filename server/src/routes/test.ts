import express from 'express';

const router = express.Router();

// Mock SMS storage to simulate SMS responses
const mockSmsResponses: Array<{ to: string; message: string; timestamp: Date }> = [];

import { parseOrder } from '../services/orderParser';
import { getTenantByPhone, checkInventory } from '../services/tenantService';
import { createOrder } from '../services/orderService';
import { 
  getConversation, 
  createConversation, 
  updateConversation, 
  completeConversation 
} from '../services/conversationService';

// Test endpoint to simulate sending an SMS order
router.post('/sms', async (req, res) => {
  const { message, customerPhone, businessPhone } = req.body;

  if (!message || !customerPhone || !businessPhone) {
    return res.status(400).json({ 
      error: 'Missing required fields: message, customerPhone, businessPhone' 
    });
  }

  console.log(`\n📱 Simulating SMS from ${customerPhone} to ${businessPhone}`);
  console.log(`Message: "${message}"\n`);

  // Find the tenant/business by phone number
  const tenant = await getTenantByPhone(businessPhone);
  if (!tenant) {
    const errorMsg = `No business found for phone: ${businessPhone}`;
    return res.json({
      success: false,
      error: errorMsg,
      smsResponse: errorMsg
    });
  }

  // Check if customer is in a conversation
  const existingConversation = getConversation(customerPhone);
  
  if (existingConversation) {
    // Handle conversation flow
    return await handleTestConversationStep(existingConversation, message, customerPhone, tenant, res);
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

  // Check if name is missing (table is optional)
  if (!parsedOrder.customerName) {
    createConversation(customerPhone, businessPhone, 'awaiting_info', message, parsedOrder);
    return res.json({
      success: false,
      awaitingInput: 'name',
      parsedOrder,
      smsResponse: "What's your name?"
    });
  }

  // Process complete order
  return await processTestOrder(parsedOrder, customerPhone, businessPhone, tenant, res);
});

// Handle multi-step conversation in test mode
async function handleTestConversationStep(conversation: any, message: string, customerPhone: string, tenant: any, res: any) {
  if (conversation.stage === 'awaiting_info') {
    const { parsedOrder } = conversation;
    let customerName = parsedOrder.customerName;
    let tableNumber = parsedOrder.tableNumber;
    
    // Parse the response for name and table
    const commaMatch = message.match(/^([^,]+),\s*(?:table\s*)?([\d]+)/i);
    if (commaMatch) {
      if (!customerName) customerName = commaMatch[1].trim();
      if (!tableNumber) tableNumber = commaMatch[2].trim();
    } else {
      const tableMatch = message.match(/(?:table\s*|#)?(\d+)/i);
      if (tableMatch && !tableNumber) {
        tableNumber = tableMatch[1];
        if (!customerName) {
          customerName = message.replace(/(?:table\s*|#)?\d+/i, '').trim();
        }
      } else if (!customerName) {
        customerName = message.trim();
      }
    }
    
    parsedOrder.customerName = customerName;
    parsedOrder.tableNumber = tableNumber || 'N/A';
    
    completeConversation(customerPhone);
    return processTestOrder(
      parsedOrder,
      customerPhone,
      conversation.businessPhone,
      tenant,
      res
    );
  }
}

// Process a complete test order
async function processTestOrder(parsedOrder: any, customerPhone: string, businessPhone: string, tenant: any, res: any) {
  // Check inventory for all items
  const inventoryIssues: string[] = [];
  const stockWarnings: string[] = [];
  
  for (const item of parsedOrder.items) {
    const { available, inStock } = await checkInventory(businessPhone, item.name, item.quantity);
    
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
  await createOrder(orderId, {
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
    .map((item: any) => {
      const mods = item.modifications ? ` (${item.modifications.join(', ')})` : '';
      return `${item.quantity}x ${item.name}${mods} ($${(item.price * item.quantity).toFixed(2)})`;
    })
    .join('\n');

  const paymentLink = `http://localhost:3000/pay/${orderId}`;
  const stockInfo = stockWarnings.length > 0 ? '\n\n' + stockWarnings.join('\n') + '\n' : '';
  const customerInfo = `👤 ${parsedOrder.customerName} | Table #${parsedOrder.tableNumber}\n\n`;
  
  const smsResponse = parsedOrder.hasFuzzyMatches 
    ? `✓ I understood your order as:\n\n${customerInfo}${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nIf this looks correct, pay now:\n${paymentLink}`
    : `Order ready for payment:\n\n${customerInfo}${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nPay now:\n${paymentLink}`;

  return res.json({
    success: true,
    parsedOrder,
    orderId,
    paymentLink,
    smsResponse
  });
}

// Debug endpoint to view all orders (for testing without auth)
router.get('/orders', (req, res) => {
  const allOrders = require('../services/orderService').getAllOrders();
  res.json({ 
    totalOrders: allOrders.length,
    orders: allOrders.map((order: any) => ({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      businessPhone: order.businessPhone,
      businessName: order.tenant?.businessName,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      tableNumber: order.tableNumber
    }))
  });
});

// Debug endpoint to view orders for a specific business
router.get('/orders/:businessPhone', (req, res) => {
  const { businessPhone } = req.params;
  const allOrders = require('../services/orderService').getAllOrders();
  const businessOrders = allOrders.filter((order: any) => order.businessPhone === businessPhone);
  
  res.json({
    businessPhone,
    totalOrders: businessOrders.length,
    orders: businessOrders
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
