import axios from 'axios';
import { InventoryIntegration, InventoryItem } from './types';

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