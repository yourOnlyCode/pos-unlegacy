export type IntegrationProvider = 'square' | 'toast' | 'clover' | 'shopify' | 'manual';

export interface InventoryIntegration {
  provider: IntegrationProvider;
  accessToken?: string;
  refreshToken?: string;
  merchantId?: string;
  locationId?: string;
  apiKey?: string;
  storeUrl?: string;
  lastSyncedAt?: Date;
  enabled: boolean;
}

export interface InventoryItem {
  externalId: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string;
}