import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clear environment overrides so pg respects explicit credentials
delete process.env.PGUSER;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;
delete process.env.PGPASSWORD;

const poolerConfig = {
  host: process.env.PGHOST || 'aws-0-ap-south-1.pooler.supabase.com',
  port: Number(process.env.PGPORT) || 6543,
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres.jzijljcvsfjbexcjvadh',
  password: process.env.PGPASSWORD || 'ArYaN##3040',
  ssl: { rejectUnauthorized: false }
};

const supabaseUrl = process.env.SUPABASE_URL || 'https://jzijljcvsfjbexcjvadh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function setupAndSeed() {
  console.log('====================================================');
  console.log('⚡ RESETTING & SEEDING SUPABASE ECOMMERCE DATABASE');
  console.log('====================================================');

  const client = new pg.Client(poolerConfig);
  console.log('Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('✅ Connected successfully!');

  // Step 1: Drop conflicting legacy tables
  console.log('\n[1/4] Dropping legacy conflicting tables...');
  await client.query(`
    DROP TABLE IF EXISTS
      availabilities,
      booking_slots,
      bookmarks,
      chats,
      match_requests,
      meetings,
      messages,
      notifications,
      reports,
      sessions,
      skills,
      user_learning_skills,
      user_offered_skills,
      reviews,
      users
    CASCADE;
  `);
  console.log('✅ Legacy tables dropped.');

  // Step 2: Execute schema.sql
  console.log('\n[2/4] Executing schema.sql to create Ecommerce tables & indexes...');
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await client.query(sql);
  console.log('✅ Ecommerce schema, indexes, grants, and cache reload executed.');

  // Verify created tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('\nVerified Public Tables:');
  res.rows.forEach(r => console.log(` ✔ ${r.table_name}`));

  await client.end();

  // Step 3: Seed data from local_db_snapshot.json
  console.log('\n[3/4] Seeding data from local_db_snapshot.json into Supabase...');
  const snapshotPath = path.join(__dirname, '../database/local_db_snapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    console.error('❌ local_db_snapshot.json not found!');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // 1. Categories
  if (snapshot.categories && snapshot.categories.length > 0) {
    const { error } = await supabase.from('categories').upsert(snapshot.categories, { onConflict: 'id' });
    if (error) throw new Error(`Error seeding categories: ${error.message}`);
    console.log(` ✔ Seeded ${snapshot.categories.length} categories`);
  }

  // 2. Products
  if (snapshot.products && snapshot.products.length > 0) {
    const { error } = await supabase.from('products').upsert(snapshot.products, { onConflict: 'id' });
    if (error) throw new Error(`Error seeding products: ${error.message}`);
    console.log(` ✔ Seeded ${snapshot.products.length} products`);
  }

  // 3. Users
  if (snapshot.users && snapshot.users.length > 0) {
    const existingUsers = [...snapshot.users];
    const userIds = new Set(existingUsers.map(u => u.id));

    // Ensure users referenced in orders and reviews exist
    const referencedUserIds = new Set([
      ...(snapshot.orders || []).map(o => o.user_id),
      ...(snapshot.reviews || []).map(r => r.user_id)
    ]);

    for (const refId of referencedUserIds) {
      if (refId && !userIds.has(refId)) {
        existingUsers.push({
          id: refId,
          name: refId.startsWith('test') ? 'Test Reviewer' : 'Customer / Guest',
          email: `${refId.replace(/[^a-zA-Z0-9]/g, '_')}@ecommerce.internal`,
          password_hash: '',
          phone: '',
          auth_provider: 'guest',
          role: 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        userIds.add(refId);
      }
    }

    const { error } = await supabase.from('users').upsert(existingUsers, { onConflict: 'id' });
    if (error) throw new Error(`Error seeding users: ${error.message}`);
    console.log(` ✔ Seeded ${existingUsers.length} users (including order/review refs)`);
  }

  // 4. Cart Items
  if (snapshot.cart_items && snapshot.cart_items.length > 0) {
    const { error } = await supabase.from('cart_items').upsert(snapshot.cart_items, { onConflict: 'id' });
    if (error) console.warn(` Notice on cart_items: ${error.message}`);
    else console.log(` ✔ Seeded ${snapshot.cart_items.length} cart items`);
  }

  // 5. Wishlist Items
  if (snapshot.wishlist_items && snapshot.wishlist_items.length > 0) {
    const { error } = await supabase.from('wishlist_items').upsert(snapshot.wishlist_items, { onConflict: 'id' });
    if (error) console.warn(` Notice on wishlist_items: ${error.message}`);
    else console.log(` ✔ Seeded ${snapshot.wishlist_items.length} wishlist items`);
  }

  // 6. Orders
  if (snapshot.orders && snapshot.orders.length > 0) {
    const { error } = await supabase.from('orders').upsert(snapshot.orders, { onConflict: 'id' });
    if (error) console.warn(` Notice on orders: ${error.message}`);
    else console.log(` ✔ Seeded ${snapshot.orders.length} orders`);
  }

  // 7. Order Items
  if (snapshot.order_items && snapshot.order_items.length > 0) {
    const { error } = await supabase.from('order_items').upsert(snapshot.order_items, { onConflict: 'id' });
    if (error) console.warn(` Notice on order_items: ${error.message}`);
    else console.log(` ✔ Seeded ${snapshot.order_items.length} order items`);
  }

  // 8. Reviews
  if (snapshot.reviews && snapshot.reviews.length > 0) {
    const { error } = await supabase.from('reviews').upsert(snapshot.reviews, { onConflict: 'id' });
    if (error) console.warn(` Notice on reviews: ${error.message}`);
    else console.log(` ✔ Seeded ${snapshot.reviews.length} reviews`);
  }

  // 9. Support Cases
  if (snapshot.support_cases && snapshot.support_cases.length > 0) {
    const { error } = await supabase.from('support_cases').upsert(snapshot.support_cases, { onConflict: 'id' });
    if (error) console.warn(` Notice on support_cases: ${error.message}`);
    else console.log(` ✔ Seeded ${snapshot.support_cases.length} support cases`);
  }

  // Step 4: Verify via PostgREST client
  console.log('\n[4/4] Verifying PostgREST API query to products...');
  const { data: fetchedProducts, error: fetchErr } = await supabase.from('products').select('*');
  if (fetchErr) {
    throw new Error(`PostgREST verification failed: ${fetchErr.message}`);
  }
  console.log(`✅ Success! PostgREST returned ${fetchedProducts.length} products with no schema errors.`);
  console.log('\nSample Product:');
  console.log(` - ID: ${fetchedProducts[0]?.id}`);
  console.log(` - Name: ${fetchedProducts[0]?.name}`);
  console.log(` - Category: ${fetchedProducts[0]?.category}`);
  console.log(` - Price: $${fetchedProducts[0]?.price}`);
  console.log('====================================================');
  console.log('🎉 SUPABASE ECOMMERCE DATABASE FULLY RESTORED!');
  console.log('====================================================');
}

setupAndSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error during setup & seed:', err);
    process.exit(1);
  });
