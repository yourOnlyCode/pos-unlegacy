import { InventoryIntegration, InventoryItem } from './types';
import { syncSquareInventory } from './square';
import { syncToastInventory } from './toast';
import { syncCloverInventory } from './clover';
import { syncShopifyInventory } from './shopify';

export * from './types';

// Main sync dispatcher
export async function syncInventoryFromProvider(integration: InventoryIntegration): Promise<InventoryItem[]> {
  if (!integration.enabled) {
    throw new Error('Integration is disabled');
  }

  switch (integration.provider) {
    case 'square':
      return syncSquareInventory(integration);
    case 'toast':
      return syncToastInventory(integration);
    case 'clover':
      return syncCloverInventory(integration);
    case 'shopify':
      return syncShopifyInventory(integration);
    case 'manual':
      return []; // Manual inventory managed in app
    default:
      throw new Error(`Unsupported provider: ${integration.provider}`);
  }
}