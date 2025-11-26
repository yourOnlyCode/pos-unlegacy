import axios from 'axios';
import { InventoryIntegration, InventoryItem } from './types';

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