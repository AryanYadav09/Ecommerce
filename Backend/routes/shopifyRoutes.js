import express from 'express';
import { getShopifyProducts, createShopifyCart } from '../integrations/shopify/shopifyClient.js';
import { verifyShopifyHmac, handleShopifyWebhook } from '../integrations/shopify/shopifyWebhooks.js';

const router = express.Router();

// Webhook endpoint (Requires raw body for HMAC verification)
router.post('/webhooks/shopify', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'] || 'orders/create';
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    const rawBody = typeof req.body === 'string' ? req.body : req.body.toString('utf8');

    if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
      console.warn('[Shopify Webhook] HMAC validation failed');
      return res.status(401).send('HMAC validation failed');
    }

    const payload = JSON.parse(rawBody);
    await handleShopifyWebhook(topic, payload);

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('[Shopify Webhook Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Headless storefront products
router.get('/shopify/products', async (req, res) => {
  try {
    const products = await getShopifyProducts(Number(req.query.limit) || 20);
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Headless storefront cart creation
router.post('/shopify/cart', async (req, res) => {
  try {
    const { lines } = req.body;
    const session = await createShopifyCart(lines || []);
    return res.json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
