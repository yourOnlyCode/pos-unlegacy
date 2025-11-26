interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifications?: string[];
}

interface Order {
  id: string;
  customerPhone: string;
  customerName?: string;
  tableNumber?: string;
  items: OrderItem[];
  total: number;
  status: string;
}

interface POSConfig {
  provider: 'toast' | 'square' | 'clover' | 'shopify' | 'none';
  apiKey?: string;
  locationId?: string;
  webhookUrl?: string;
  enabled: boolean;
}

export async function forwardOrderToPOS(order: Order, posConfig: POSConfig): Promise<boolean> {
  if (!posConfig.enabled || posConfig.provider === 'none') {
    console.log(`POS integration disabled for order ${order.id}`);
    return true;
  }

  try {
    switch (posConfig.provider) {
      case 'toast':
        return await forwardToToast(order, posConfig);
      case 'square':
        return await forwardToSquare(order, posConfig);
      case 'clover':
        return await forwardToClover(order, posConfig);
      case 'shopify':
        return await forwardToShopify(order, posConfig);
      default:
        console.error(`Unsupported POS provider: ${posConfig.provider}`);
        return false;
    }
  } catch (error) {
    console.error(`Failed to forward order ${order.id} to ${posConfig.provider}:`, error);
    return false;
  }
}

async function forwardToToast(order: Order, config: POSConfig): Promise<boolean> {
  const toastOrder = {
    externalId: order.id,
    customer: {
      phone: order.customerPhone,
      firstName: order.customerName || 'SMS Customer'
    },
    dining: {
      tableNumber: order.tableNumber
    },
    selections: order.items.map(item => ({
      item: {
        name: item.name,
        price: item.price * 100 // Toast uses cents
      },
      quantity: item.quantity,
      modifiers: item.modifications?.map(mod => ({
        name: mod,
        price: 0
      })) || []
    })),
    orderSource: 'SMS'
  };

  const response = await fetch(`${config.webhookUrl}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(toastOrder)
  });

  return response.ok;
}

async function forwardToSquare(order: Order, config: POSConfig): Promise<boolean> {
  const squareOrder = {
    reference_id: order.id,
    location_id: config.locationId,
    line_items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity.toString(),
      base_price_money: {
        amount: item.price * 100, // Square uses cents
        currency: 'USD'
      },
      modifiers: item.modifications?.map(mod => ({
        name: mod
      })) || []
    })),
    metadata: {
      source: 'SMS',
      customer_phone: order.customerPhone,
      table_number: order.tableNumber
    }
  };

  const response = await fetch('https://connect.squareup.com/v2/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ order: squareOrder })
  });

  return response.ok;
}

async function forwardToClover(order: Order, config: POSConfig): Promise<boolean> {
  const cloverOrder = {
    id: order.id,
    currency: 'usd',
    employee: { id: 'SMS_SYSTEM' },
    orderType: { id: 'online' },
    lineItems: order.items.map(item => ({
      name: item.name,
      price: item.price * 100, // Clover uses cents
      unitQty: item.quantity,
      modifications: item.modifications?.map(mod => ({
        name: mod
      })) || []
    })),
    note: `SMS Order - Phone: ${order.customerPhone}${order.tableNumber ? `, Table: ${order.tableNumber}` : ''}`
  };

  const response = await fetch(`https://api.clover.com/v3/merchants/${config.locationId}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cloverOrder)
  });

  return response.ok;
}

async function forwardToShopify(order: Order, config: POSConfig): Promise<boolean> {
  const shopifyOrder = {
    order: {
      line_items: order.items.map(item => ({
        title: item.name,
        price: item.price.toFixed(2),
        quantity: item.quantity,
        properties: item.modifications?.map(mod => ({
          name: 'Modification',
          value: mod
        })) || []
      })),
      customer: {
        phone: order.customerPhone,
        first_name: order.customerName || 'SMS Customer'
      },
      note: `SMS Order${order.tableNumber ? ` - Table: ${order.tableNumber}` : ''}`,
      tags: 'SMS, Online Order'
    }
  };

  const response = await fetch(`${config.webhookUrl}/admin/api/2023-10/orders.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': config.apiKey!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shopifyOrder)
  });

  return response.ok;
}