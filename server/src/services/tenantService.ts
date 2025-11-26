interface Tenant {
  id: string;
  businessName: string;
  phoneNumber: string;
  menu: Record<string, number>;
  inventory: Record<string, number>;
  stripeAccountId?: string;
  settings: {
    currency: string;
    timezone: string;
    autoReply: boolean;
  };
}

const tenants = new Map<string, Tenant>();

tenants.set('+15551234567', {
  id: 'cafe-downtown',
  businessName: 'Downtown Cafe',
  phoneNumber: '+15551234567',
  menu: {
    'coffee': 4.50,
    'latte': 5.25,
    'cappuccino': 4.75,
    'sandwich': 8.99,
    'pastry': 3.25,
    'bagel': 3.50,
    'muffin': 2.99
  },
  inventory: {
    'coffee': 50,
    'latte': 30,
    'cappuccino': 25,
    'sandwich': 15,
    'pastry': 20,
    'bagel': 10,
    'muffin': 12
  },
  stripeAccountId: 'acct_test123',
  settings: {
    currency: 'USD',
    timezone: 'America/New_York',
    autoReply: true
  }
});

tenants.set('+15559876543', {
  id: 'pizza-palace',
  businessName: 'Pizza Palace',
  phoneNumber: '+15559876543',
  menu: {
    'pizza': 12.99,
    'wings': 8.50,
    'soda': 2.25,
    'salad': 6.75
  },
  inventory: {
    'pizza': 20,
    'wings': 5,
    'soda': 50,
    'salad': 8
  },
  stripeAccountId: 'acct_test456',
  settings: {
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    autoReply: true
  }
});

export function getTenantByPhone(phoneNumber: string): Tenant | null {
  return tenants.get(phoneNumber) || null;
}

export function checkInventory(phoneNumber: string, itemName: string, quantity: number): { available: boolean; inStock: number } {
  const tenant = tenants.get(phoneNumber);
  if (!tenant) return { available: false, inStock: 0 };
  
  const inStock = tenant.inventory[itemName] || 0;
  return {
    available: inStock >= quantity,
    inStock
  };
}