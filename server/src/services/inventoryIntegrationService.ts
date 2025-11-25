import axios from 'axios';

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

// Square API integration
export async function syncSquareInventory(integration: InventoryIntegration): Promise<InventoryItem[]> {
  if (!integration.accessToken || !integration.locationId) {
    throw new Error('Square access token and location ID required');
  }

  const baseUrl = process.env.SQUARE_SANDBOX === 'true' 
    ? 'https://connect.squareupsandbox.com' 
    : 'https://connect.squareup.com';

  try {
    // Fetch catalog items
    const catalogResponse = await axios.post(
      `${baseUrl}/v2/catalog/search`,
      {
        object_types: ['ITEM'],
        limit: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-11-20'
        }
      }
    );

    const items: InventoryItem[] = [];
    const catalogItems = catalogResponse.data.objects || [];

    // Fetch inventory counts for each item
    for (const item of catalogItems) {
      const itemData = item.item_data;
      if (!itemData || !itemData.variations) continue;

      for (const variation of itemData.variations) {
        try {
          const invResponse = await axios.post(
            `${baseUrl}/v2/inventory/counts/batch-retrieve`,
            {
              catalog_object_ids: [variation.id],
              location_ids: [integration.locationId]
            },
            {
              headers: {
                'Authorization': `Bearer ${integration.accessToken}`,
                'Content-Type': 'application/json',
                'Square-Version': '2024-11-20'
              }
            }
          );

          const count = invResponse.data.counts?.[0]?.quantity || '0';
          const price = variation.item_variation_data?.price_money?.amount 
            ? parseInt(variation.item_variation_data.price_money.amount) / 100 
            : 0;

          items.push({
            externalId: variation.id,
            name: itemData.name,
            quantity: parseInt(count),
            price,
            sku: variation.item_variation_data?.sku
          });
        } catch (err) {
          console.error(`Failed to fetch inventory for ${variation.id}:`, err);
        }
      }
    }

    return items;
  } catch (error) {
    console.error('Square inventory sync failed:', error);
    throw new Error('Failed to sync Square inventory');
  }
}

// Toast API integration
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

// Clover API integration
export async function syncCloverInventory(integration: InventoryIntegration): Promise<InventoryItem[]> {
  if (!integration.accessToken || !integration.merchantId) {
    throw new Error('Clover access token and merchant ID required');
  }

  const baseUrl = process.env.CLOVER_SANDBOX === 'true'
    ? 'https://sandbox.dev.clover.com'
    : 'https://api.clover.com';

  try {
    const response = await axios.get(
      `${baseUrl}/v3/merchants/${integration.merchantId}/items`,
      {
        headers: { 'Authorization': `Bearer ${integration.accessToken}` },
        params: { expand: 'itemStock' }
      }
    );

    const items: InventoryItem[] = (response.data.elements || []).map((item: any) => ({
      externalId: item.id,
      name: item.name,
      quantity: item.itemStock?.quantity || 0,
      price: item.price / 100,
      sku: item.sku
    }));

    return items;
  } catch (error) {
    console.error('Clover inventory sync failed:', error);
    throw new Error('Failed to sync Clover inventory');
  }
}

// Shopify API integration
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
