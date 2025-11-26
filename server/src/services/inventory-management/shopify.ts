import axios from 'axios';
import { InventoryIntegration, InventoryItem } from './types';

export async function syncShopifyInventory(integration: InventoryIntegration): Promise<InventoryItem[]> {
  if (!integration.accessToken || !integration.storeUrl) {
    throw new Error('Shopify access token and store URL required');
  }

  try {
    const response = await axios.get(
      `https://${integration.storeUrl}/admin/api/2024-10/products.json`,
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken
        }
      }
    );

    const items: InventoryItem[] = [];
    for (const product of response.data.products || []) {
      for (const variant of product.variants || []) {
        items.push({
          externalId: variant.id.toString(),
          name: `${product.title}${variant.title !== 'Default Title' ? ` - ${variant.title}` : ''}`,
          quantity: variant.inventory_quantity || 0,
          price: parseFloat(variant.price),
          sku: variant.sku
        });
      }
    }

    return items;
  } catch (error) {
    console.error('Shopify inventory sync failed:', error);
    throw new Error('Failed to sync Shopify inventory');
  }
}