export interface Tenant {
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

export async function getTenantByPhone(phoneNumber: string): Promise<Tenant | null> {
  try {
    const response = await fetch(`/api/tenants/${phoneNumber}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function checkInventory(phoneNumber: string, items: Array<{ name: string; quantity: number }>): Promise<Array<{ name: string; quantity: number; available: boolean; inStock: number }>> {
  try {
    const response = await fetch(`/api/tenants/${phoneNumber}/inventory/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const data = await response.json();
    return data.results;
  } catch {
    return items.map(item => ({ ...item, available: false, inStock: 0 }));
  }
}