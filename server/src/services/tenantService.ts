interface Tenant {
  id: string;
  businessName: string;
  phoneNumber: string;
  menu: Record<string, number>;
  stripeAccountId?: string;
  settings: {
    currency: string;
    timezone: string;
    autoReply: boolean;
  };
}

// In production, this would be a database
const tenants = new Map<string, Tenant>();

// Initialize with sample tenants
tenants.set('+15551234567', {
  id: 'cafe-downtown',
  businessName: 'Downtown Cafe',
  phoneNumber: '+15551234567',
  menu: {
    'coffee': 4.50,
    'latte': 5.25,
    'sandwich': 8.99,
    'pastry': 3.25
  },
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
  settings: {
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    autoReply: true
  }
});

export function getTenantByPhone(phoneNumber: string): Tenant | null {
  return tenants.get(phoneNumber) || null;
}

export function getAllTenants(): Tenant[] {
  return Array.from(tenants.values());
}

export function addTenant(tenant: Tenant): void {
  tenants.set(tenant.phoneNumber, tenant);
}

export function updateTenant(phoneNumber: string, updates: Partial<Tenant>): boolean {
  const tenant = tenants.get(phoneNumber);
  if (!tenant) return false;
  
  tenants.set(phoneNumber, { ...tenant, ...updates });
  return true;
}