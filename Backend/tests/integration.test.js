import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { listProducts, getProductById, addProductReview } from '../services/productService.js';
import { findUserByEmail, createUser } from '../services/userService.js';
import { getUserCartData, addItemToCart, updateCartItemQuantity } from '../services/cartService.js';
import { createOrder, getUserOrders, updateOrderStatus } from '../services/orderService.js';
import { getRecommendations, performIntelligentSearch } from '../services/aiGatewayService.js';
import { createSalesforceCase, syncContactToSalesforce } from '../integrations/salesforce/salesforceClient.js';
import { verifyShopifyHmac, handleShopifyWebhook } from '../integrations/shopify/shopifyWebhooks.js';

test('1. Product API & Catalog Services', async (t) => {
  await t.test('listProducts returns products formatted with _id and inStock', async () => {
    const products = await listProducts();
    assert.ok(Array.isArray(products));
    assert.ok(products.length >= 10, 'Expected at least 10 products');
    const first = products[0];
    assert.ok(first._id || first.id);
    assert.ok(typeof first.price === 'number');
    assert.ok(first.name);
  });

  await t.test('getProductById retrieves existing product', async () => {
    const products = await listProducts();
    const sample = products[0];
    const retrieved = await getProductById(sample._id || sample.id);
    assert.equal(retrieved.name, sample.name);
    assert.equal(retrieved.category, sample.category);
  });

  await t.test('addProductReview updates review list and rating', async () => {
    const products = await listProducts();
    const sample = products[0];
    const testUser = await createUser({
      name: 'Reviewer User',
      email: `reviewer_${Date.now()}@example.com`,
      password: 'password123'
    });
    const res = await addProductReview({
      productId: sample._id || sample.id,
      userId: testUser.id || testUser._id,
      userName: testUser.name,
      rating: 5,
      comment: 'Excellent quality product!'
    });
    assert.ok(Array.isArray(res.reviews));
    assert.ok(res.totalReviews > 0);
  });
});

test('2. User Authentication & Profile Services', async (t) => {
  const testEmail = `testuser_${Date.now()}@example.com`;

  await t.test('createUser successfully persists user in Supabase', async () => {
    const created = await createUser({
      name: 'Test Automation User',
      email: testEmail,
      password: 'hashed_password_123',
      phone: '9876543210'
    });
    assert.ok(created._id || created.id);
    assert.equal(created.email, testEmail);
  });

  await t.test('findUserByEmail retrieves persisted user', async () => {
    const found = await findUserByEmail(testEmail);
    assert.ok(found);
    assert.equal(found.name, 'Test Automation User');
  });
});

test('3. Relational Cart Operations', async (t) => {
  const products = await listProducts();
  const sampleProduct = products[0];
  const prodId = sampleProduct._id || sampleProduct.id;

  const testUser = await createUser({
    name: 'Cart Test User',
    email: `cart_user_${Date.now()}@example.com`,
    password: 'password123'
  });
  const testUserId = testUser.id || testUser._id;

  await t.test('addItemToCart adds and increments items correctly', async () => {
    const cart = await addItemToCart(testUserId, prodId, 'M');
    assert.equal(cart[prodId]?.['M'], 1);

    const incremented = await addItemToCart(testUserId, prodId, 'M');
    assert.equal(incremented[prodId]?.['M'], 2);
  });

  await t.test('updateCartItemQuantity adjusts quantity or removes item', async () => {
    const updated = await updateCartItemQuantity(testUserId, prodId, 'M', 5);
    assert.equal(updated[prodId]?.['M'], 5);

    const cleared = await updateCartItemQuantity(testUserId, prodId, 'M', 0);
    assert.equal(cleared[prodId]?.['M'], undefined);
  });
});

test('4. Orders & Fulfillment Services', async (t) => {
  const products = await listProducts();
  const sampleProduct = products[0];

  const testUser = await createUser({
    name: 'Order Test User',
    email: `order_user_${Date.now()}@example.com`,
    password: 'password123'
  });
  const testUserId = testUser.id || testUser._id;

  await t.test('createOrder stores order and line items', async () => {
    const newOrder = await createOrder({
      userId: testUserId,
      amount: 150,
      paymentMethod: 'COD',
      payment: false,
      address: { street: '123 Tech Lane', city: 'Metropolis', zipcode: '10001' },
      items: [
        { productId: sampleProduct._id || sampleProduct.id, name: sampleProduct.name, price: sampleProduct.price, size: 'L', quantity: 2 }
      ]
    });

    assert.ok(newOrder._id || newOrder.id);
    assert.equal(newOrder.amount, 150);
    assert.equal(newOrder.items.length, 1);

    const userOrders = await getUserOrders(testUserId);
    assert.equal(userOrders.length, 1);
  });
});

test('5. AI Gateway Search & Recommendations', async (t) => {
  await t.test('getRecommendations returns ranked candidate list with reasons', async () => {
    const recs = await getRecommendations({ limit: 4 });
    assert.ok(Array.isArray(recs.recommendations));
    assert.ok(recs.recommendations.length > 0);
    assert.ok(recs.recommendations[0].reason);
  });

  await t.test('performIntelligentSearch filters by natural language intent and budget', async () => {
    const searchRes = await performIntelligentSearch({ query: 'jacket under 100', limit: 5 });
    assert.ok(Array.isArray(searchRes.results));
    assert.ok(searchRes.results.length > 0);
    assert.ok(searchRes.parsed_intent.max_price === 100);
  });
});

test('6. Enterprise CRM (Salesforce) Integration', async (t) => {
  await t.test('syncContactToSalesforce completes without crashing', async () => {
    const result = await syncContactToSalesforce({
      name: 'CRM Enterprise Lead',
      email: 'enterprise@lead.com'
    });
    assert.ok(result.success);
  });

  await t.test('createSalesforceCase creates and tracks customer support case', async () => {
    const supportCase = await createSalesforceCase({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Order Tracking Inquiry',
      message: 'Where is my order #12345?'
    });
    assert.ok(supportCase.id);
    assert.ok(supportCase.salesforce_case_id);
  });
});

test('7. Headless Commerce (Shopify) Webhook Verification', async (t) => {
  await t.test('verifyShopifyHmac validates authentic payload', () => {
    const secret = 'test_webhook_secret_key';
    const payload = JSON.stringify({ id: 12345, event: 'order' });
    const validHmac = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');

    assert.equal(verifyShopifyHmac(payload, validHmac, secret), true);
    assert.equal(verifyShopifyHmac(payload, 'invalid_hmac_string', secret), false);
  });

  await t.test('handleShopifyWebhook handles orders/create gracefully', async () => {
    await handleShopifyWebhook('orders/create', {
      id: 99887766,
      total_price: 299.99,
      financial_status: 'paid',
      customer: { first_name: 'Shopify', last_name: 'Buyer', email: 'shopify_buyer@example.com' }
    });
  });
});
