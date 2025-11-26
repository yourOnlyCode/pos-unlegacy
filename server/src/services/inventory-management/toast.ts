import axios from 'axios';
import { InventoryIntegration, InventoryItem } from './types';

export async function syncToastInventory(integration: InventoryIntegration): Promise<InventoryItem[]> {
  if (!integration.accessToken) {
    throw new Error('Toast access token required');
  }

  try {
    const response = await axios.get('https://ws-api.toasttab.com/v2/menus', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Toast-Restaurant-External-ID': integration.merchantId || ''
      }
    });

    const items: InventoryItem[] = [];
    const menus = response.data.menus || [];

    for (const menu of menus) {
      for (const group of menu.groups || []) {
        for (const item of group.items || []) {
          items.push({
            externalId: item.guid,
            name: item.name,
            quantity: item.quantity || 0,
            price: item.price / 100,
            sku: item.sku
          });
        }
      }
    }

    return items;
  } catch (error) {
    console.error('Toast inventory sync failed:', error);
    throw new Error('Failed to sync Toast inventory');
  }
}