import { prisma } from '../lib/prisma';

export interface Tenant {
  id: string;
  businessName: string;
  phoneNumber: string;
  menu: Record<string, { price: number; image?: string; description?: string } | number>;
  inventory: Record<string, number>;
  stripeAccountId?: string;
  settings: {
    currency: string;
    timezone: string;
    autoReply: boolean;
    checkInTimerMinutes?: number;
    checkInEnabled?: boolean;
  };
  posIntegration?: {
    provider: 'toast' | 'square' | 'clover' | 'shopify' | 'none';
    apiKey?: string;
    locationId?: string;
    webhookUrl?: string;
    enabled: boolean;
  };
}

export async function getTenantByPhone(phoneNumber: string): Promise<Tenant | null> {
  try {
    const business = await prisma.business.findUnique({
      where: { phoneNumber }
    });
    
    if (!business) return null;
    
    return {
      id: business.id,
      businessName: business.businessName,
      phoneNumber: business.phoneNumber!,
      menu: business.menu as any,
      inventory: business.inventory as any,
      stripeAccountId: business.stripeAccountId || undefined,
      settings: business.settings as any,
      posIntegration: business.posIntegration as any
    };
  } catch (error) {
    console.error(`[tenantService.getTenantByPhone] Error:`, error);
    return null;
  }
}

export async function getTenantById(businessId: string): Promise<Tenant | null> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) return null;
    
    return {
      id: business.id,
      businessName: business.businessName,
      phoneNumber: business.phoneNumber || '',
      menu: business.menu as any,
      inventory: business.inventory as any,
      stripeAccountId: business.stripeAccountId || undefined,
      settings: business.settings as any,
      posIntegration: business.posIntegration as any
    };
  } catch (error) {
    console.error(`[tenantService.getTenantById] Error:`, error);
    return null;
  }
}

export async function getAllTenants(): Promise<Tenant[]> {
  try {
    const businesses = await prisma.business.findMany();
    
    return businesses.map(business => ({
      id: business.id,
      businessName: business.businessName,
      phoneNumber: business.phoneNumber || '',
      menu: business.menu as any,
      inventory: business.inventory as any,
      stripeAccountId: business.stripeAccountId || undefined,
      settings: business.settings as any,
      posIntegration: business.posIntegration as any
    }));
  } catch (error) {
    console.error(`[tenantService.getAllTenants] Error:`, error);
    return [];
  }
}

export async function addTenant(tenant: Tenant): Promise<void> {
  await prisma.business.create({
    data: {
      id: tenant.id,
      businessName: tenant.businessName,
      email: '', // Will be updated later through auth
      passwordHash: '', // Will be updated later through auth
      phoneNumber: tenant.phoneNumber,
      stripeAccountId: tenant.stripeAccountId,
      menu: tenant.menu as any,
      inventory: tenant.inventory as any,
      settings: tenant.settings as any,
      posIntegration: tenant.posIntegration as any
    }
  });
}

export async function updateTenant(phoneNumber: string, updates: Partial<Tenant>): Promise<boolean> {
  try {
    const business = await prisma.business.findUnique({
      where: { phoneNumber }
    });
    
    if (!business) return false;
    
    await prisma.business.update({
      where: { phoneNumber },
      data: {
        ...(updates.businessName && { businessName: updates.businessName }),
        ...(updates.phoneNumber && { phoneNumber: updates.phoneNumber }),
        ...(updates.stripeAccountId && { stripeAccountId: updates.stripeAccountId }),
        ...(updates.menu && { menu: updates.menu as any }),
        ...(updates.inventory && { inventory: updates.inventory as any }),
        ...(updates.settings && { settings: updates.settings as any }),
        ...(updates.posIntegration && { posIntegration: updates.posIntegration as any })
      }
    });
    
    return true;
  } catch (error) {
    console.error(`[tenantService.updateTenant] Error:`, error);
    return false;
  }
}

export async function checkInventory(phoneNumber: string, itemName: string, quantity: number): Promise<{ available: boolean; inStock: number }> {
  const tenant = await getTenantByPhone(phoneNumber);
  if (!tenant) return { available: false, inStock: 0 };
  
  const inStock = tenant.inventory[itemName] || 0;
  return {
    available: inStock >= quantity,
    inStock
  };
}