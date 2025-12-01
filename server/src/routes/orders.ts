import { Router } from 'express';
import { getAllTenants, checkInventory } from '../services/tenantService';
import { parseOrder } from '../services/orderParser';
import { createOrder, updateOrderStatus, getOrder } from '../services/orderService';

const router = Router();

// Simple in-memory conversation state for web users
const webConversations = new Map<string, {
  stage: string;
  originalMessage: string;
  parsedOrder: any;
  businessId: string;
  customerName?: string;
}>();

// Store active chat sessions for notifications
const activeChatSessions = new Map<string, { sessionId: string; lastActivity: Date }>();

// Clear conversation session
function clearConversationSession(customerPhone: string): void {
  webConversations.delete(customerPhone);
  activeChatSessions.delete(customerPhone);
}

// Send notification to customer chat
function sendChatNotification(customerPhone: string, message: string): void {
  const session = activeChatSessions.get(customerPhone);
  if (session) {
    // Store notification for polling
    const notifications = getNotifications(customerPhone);
    notifications.push({
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type: 'system'
    });
  }
}

// Notification storage
const customerNotifications = new Map<string, any[]>();

function getNotifications(customerPhone: string): any[] {
  if (!customerNotifications.has(customerPhone)) {
    customerNotifications.set(customerPhone, []);
  }
  return customerNotifications.get(customerPhone)!;
}

// Handle chat-based orders from web portal
router.post('/chat', async (req, res) => {
  try {
    const { businessId, message, customerPhone } = req.body;

    // Get business info - try mock data first
    const tenants = getAllTenants();
    const mockBusiness = tenants.find(t => t.id === businessId);

    if (!mockBusiness) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = {
      id: mockBusiness.id,
      businessName: mockBusiness.businessName,
      menu: mockBusiness.menu,
      phoneNumber: mockBusiness.phoneNumber,
    };

    // Handle menu request
    if (message.toLowerCase().includes('menu')) {
      const menuText = `Menu:\n☕ Coffee - $4.50\n🥪 Sandwich - $8.99\n🧁 Pastry - $3.25\n☕ Latte - $5.25\n☕ Cappuccino - $4.75\n🧁 Muffin - $2.99\n🥯 Bagel - $3.50\n\nText your order like: "2 coffee, 1 sandwich"`;
      
      return res.json({
        response: menuText,
        type: 'info'
      });
    }

    // Check if customer is in a conversation
    const conversationKey = customerPhone || 'web-customer';
    const existingConversation = webConversations.get(conversationKey);
    
    // Track active chat session
    activeChatSessions.set(conversationKey, {
      sessionId: conversationKey,
      lastActivity: new Date()
    });
    
    if (existingConversation) {
      if (existingConversation.stage === 'awaiting_name') {
        // Handle name collection
        const { parsedOrder } = existingConversation;
        parsedOrder.customerName = message.trim();
        
        // Store customer name for future orders and clear awaiting stage
        webConversations.set(conversationKey, {
          stage: 'active',
          originalMessage: '',
          parsedOrder: null,
          businessId: businessId,
          customerName: message.trim()
        });
        return processCompleteOrder(parsedOrder, conversationKey, business.phoneNumber!, business, res);
      }
    }

    // Parse the order with tenant's menu
    const parsedOrder = parseOrder(message, business.menu);

    if (!parsedOrder.isValid) {
      const errorMsg = parsedOrder.errorMessage || 
        "Sorry, I couldn't understand your order. Please text 'menu' for options.";
      return res.json({
        response: errorMsg,
        type: 'info'
      });
    }

    // Check if name is missing and not already stored in conversation
    if (!parsedOrder.customerName && !existingConversation?.customerName) {
      webConversations.set(conversationKey, {
        stage: 'awaiting_name',
        originalMessage: message,
        parsedOrder: parsedOrder,
        businessId: businessId
      });
      
      return res.json({
        response: "What's your name?",
        type: 'info',
        awaitingName: true
      });
    }
    
    // Use stored customer name if available
    if (!parsedOrder.customerName && existingConversation?.customerName) {
      parsedOrder.customerName = existingConversation.customerName;
    }

    // Process complete order
    processCompleteOrder(parsedOrder, conversationKey, business.phoneNumber!, business, res);

  } catch (error) {
    console.error('Chat order error:', error);
    res.status(500).json({
      response: 'Sorry, something went wrong. Please try again.',
      type: 'error'
    });
  }
});

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
      stockWarnings.push(`⚠️ ${item.name}: Only ${inStock} left in stock`);
    }
  }

  if (inventoryIssues.length > 0) {
    let inventoryMsg = "Sorry, we can't fulfill your order:\n\n" + inventoryIssues.join('\n');
    if (stockWarnings.length > 0) {
      inventoryMsg += '\n\n' + stockWarnings.join('\n');
    }
    inventoryMsg += '\n\nPlease adjust your order and try again.';
    
    return res.json({
      response: inventoryMsg,
      type: 'error'
    });
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

  const customerInfo = `👤 ${parsedOrder.customerName} | Table #${parsedOrder.tableNumber || 'N/A'}\n\n`;
  const stockInfo = stockWarnings.length > 0 ? '\n\n' + stockWarnings.join('\n') + '\n' : '';
  
  const response = `Order ready for payment:\n\n${customerInfo}${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`;

  res.json({
    response,
    type: 'payment',
    orderId: orderId,
    total: parsedOrder.total,
    paymentLink: paymentLink,
    orderItems: parsedOrder.items,
    awaitingName: false
  });
}

// Update order status endpoint
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Get order before updating to check for session cleanup
    const order = getOrder(orderId);
    const success = updateOrderStatus(orderId, status);
    
    // Send thank you message and clear session when order is paid
    if (success && status === 'paid' && order?.customerPhone) {
      sendChatNotification(order.customerPhone, 'Thank you for your order! 🎉 Your payment has been confirmed and your order is being prepared.');
      // Clear session after a brief delay to allow message delivery
      setTimeout(() => clearConversationSession(order.customerPhone), 1000);
    }
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get notifications for customer
router.get('/notifications/:customerPhone', async (req, res) => {
  try {
    const { customerPhone } = req.params;
    const notifications = getNotifications(customerPhone);
    
    // Return and clear notifications
    const result = [...notifications];
    customerNotifications.set(customerPhone, []);
    
    res.json({ notifications: result });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

export default router;