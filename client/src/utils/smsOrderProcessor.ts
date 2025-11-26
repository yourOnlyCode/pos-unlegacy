import { parseOrder, ParsedOrder } from './orderParser';
import { getTenantByPhone, checkInventory, Tenant } from './tenantService';
import { createOrder } from './orderService';

export interface SmsOrderResult {
  success: boolean;
  parsedOrder?: ParsedOrder;
  orderId?: string;
  paymentLink?: string;
  smsResponse: string;
  inventoryIssues?: string[];
  stockWarnings?: string[];
  error?: string;
}

export async function processSmsOrder(
  message: string, 
  customerPhone: string, 
  businessPhone: string
): Promise<SmsOrderResult> {
  // Find the tenant/business by phone number
  const tenant = await getTenantByPhone(businessPhone);
  if (!tenant) {
    const errorMsg = `No business found for phone: ${businessPhone}`;
    return {
      success: false,
      error: errorMsg,
      smsResponse: errorMsg
    };
  }

  // Parse the order with tenant's menu
  const parsedOrder = parseOrder(message, tenant.menu);

  if (!parsedOrder.isValid) {
    const smsResponse = parsedOrder.errorMessage || 
      "Sorry, I couldn't understand your order. Please text 'menu' for options.";
    
    return {
      success: false,
      parsedOrder,
      smsResponse
    };
  }

  // Check inventory for all items
  const inventoryResults = await checkInventory(businessPhone, parsedOrder.items);
  const inventoryIssues: string[] = [];
  const stockWarnings: string[] = [];
  
  for (const result of inventoryResults) {
    if (!result.available) {
      if (result.inStock === 0) {
        inventoryIssues.push(`❌ ${result.name} is SOLD OUT`);
      } else {
        inventoryIssues.push(`❌ ${result.name}: Only ${result.inStock} left (you ordered ${result.quantity})`);
      }
    } else if (result.inStock <= 5 && result.inStock > 0) {
      stockWarnings.push(`⚠️ ${result.name}: Only ${result.inStock} left in stock`);
    }
  }

  // If any items are out of stock or insufficient, send error message
  if (inventoryIssues.length > 0) {
    let smsResponse = "Sorry, we can't fulfill your order:\n\n" + inventoryIssues.join('\n');
    if (stockWarnings.length > 0) {
      smsResponse += '\n\n' + stockWarnings.join('\n');
    }
    smsResponse += '\n\nPlease adjust your order and try again.';
    
    return {
      success: false,
      inventoryIssues,
      stockWarnings,
      smsResponse
    };
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
  let smsResponse: string;
  if (!tenant.stripeAccountId) {
    smsResponse = `Sorry, ${tenant.businessName} hasn't completed their payment setup yet. Please try again later or call directly.`;
  } else {
    const stockInfo = stockWarnings.length > 0 ? '\n\n' + stockWarnings.join('\n') + '\n' : '';
    
    const verificationNote = parsedOrder.hasFuzzyMatches 
      ? `✓ I understood your order as:\n\n${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nIf this looks correct, pay now:\n${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`
      : `Order ready for payment:\n\n${itemsList}\n\nTotal: $${parsedOrder.total.toFixed(2)}${stockInfo}\n\nPay now:\n${paymentLink}\n\n⚠️ Order will only be sent to ${tenant.businessName} after payment is confirmed.`;
    
    smsResponse = verificationNote;
  }

  return {
    success: true,
    parsedOrder: {
      customerName: parsedOrder.customerName,
      tableNumber: parsedOrder.tableNumber,
      items: parsedOrder.items,
      total: parsedOrder.total,
      hasFuzzyMatches: parsedOrder.hasFuzzyMatches,
      isValid: parsedOrder.isValid
    },
    orderId,
    paymentLink,
    smsResponse,
    stockWarnings
  };
}