import crypto from 'crypto';
import supabase from '../../config/supabase.js';
import { syncContactToSalesforce, syncOrderToSalesforce } from '../salesforce/salesforceClient.js';

export const verifyShopifyHmac = (rawBody, headerHmac, secret) => {
  if (!secret) return true; // Development mode passthrough
  if (!headerHmac) return false;

  const generatedHmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(generatedHmac), Buffer.from(headerHmac));
  } catch {
    return false;
  }
};

export const handleShopifyWebhook = async (topic, payload) => {
  console.log(`[Shopify Webhook] Processing topic: "${topic}"`);

  switch (topic) {
    case 'orders/create': {
      const shopifyOrderId = String(payload.id);
      const email = (payload.email || payload.customer?.email || '').toLowerCase().trim();
      const totalAmount = Number(payload.total_price || 0);

      const orderRecord = {
        id: `ord_shopify_${shopifyOrderId}`,
        user_id: payload.customer?.id ? `shopify_cust_${payload.customer.id}` : 'guest',
        amount: totalAmount,
        status: 'Order Placed (Shopify)',
        payment_method: 'Shopify Checkout',
        payment_status: payload.financial_status === 'paid',
        shipping_address: payload.shipping_address || {},
        date: Date.now(),
        shopify_order_id: shopifyOrderId
      };

      await supabase.from('orders').upsert(orderRecord, { onConflict: 'id' });

      // Synchronize customer & order to Salesforce CRM
      if (email) {
        syncContactToSalesforce({
          name: `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim() || 'Shopify Customer',
          email,
          phone: payload.customer?.phone || ''
        }).catch(() => {});

        syncOrderToSalesforce(orderRecord).catch(() => {});
      }

      console.log(`[Shopify Webhook] Synced Shopify Order #${shopifyOrderId} to Supabase & Salesforce.`);
      break;
    }

    case 'products/update': {
      const shopifyProdId = String(payload.id);
      const inStock = payload.variants?.some((v) => (v.inventory_quantity || 0) > 0) ?? true;

      await supabase
        .from('products')
        .update({ in_stock: inStock })
        .eq('shopify_product_id', shopifyProdId);

      console.log(`[Shopify Webhook] Updated stock status for Shopify Product #${shopifyProdId}.`);
      break;
    }

    default:
      console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
      break;
  }
};
