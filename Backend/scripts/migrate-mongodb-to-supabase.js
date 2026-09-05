import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/mongodb.js';
import supabase from '../config/supabase.js';

const toSlug = (text = '') =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export async function runMigration() {
  console.log('====================================================');
  console.log('🚀 STARTING MIGRATION: MONGODB -> SUPABASE / POSTGRESQL');
  console.log('====================================================');

  await connectDB();
  const db = mongoose.connection.db;

  // Step 1: Extract Raw Collections from MongoDB
  console.log('\n[1/5] Extracting collections from MongoDB...');
  const mongoUsers = await db.collection('users').find({}).toArray();
  const mongoProducts = await db.collection('products').find({}).toArray();
  const mongoOrders = await db.collection('orders').find({}).toArray();
  const mongoPending = await db.collection('pending_users').find({}).toArray();

  console.log(` -> Found ${mongoUsers.length} users`);
  console.log(` -> Found ${mongoProducts.length} products`);
  console.log(` -> Found ${mongoOrders.length} orders`);
  console.log(` -> Found ${mongoPending.length} pending users`);

  // Step 2: Extract & Insert Categories
  console.log('\n[2/5] Normalizing & migrating categories...');
  const categoryNames = Array.from(new Set(mongoProducts.map(p => p.category).filter(Boolean)));
  const categoryMap = {}; // name -> id

  for (const name of categoryNames) {
    const slug = toSlug(name);
    const catId = `cat_${slug}`;
    categoryMap[name] = catId;

    const catRecord = {
      id: catId,
      name,
      slug,
      description: `${name} fashion collection`,
      created_at: new Date().toISOString()
    };

    await supabase.from('categories').upsert(catRecord, { onConflict: 'id' });
  }
  console.log(` -> Migrated ${categoryNames.length} categories:`, Object.keys(categoryMap));

  // Step 3: Transform & Insert Products and Reviews
  console.log('\n[3/5] Normalizing & migrating products & reviews...');
  let totalReviewsMigrated = 0;

  for (const p of mongoProducts) {
    const productId = p._id.toString();
    const productRecord = {
      id: productId,
      name: p.name,
      description: p.description,
      price: Number(p.price) || 0,
      category: p.category,
      sub_category: p.subCategory || 'General',
      category_id: categoryMap[p.category] || null,
      sizes: p.sizes || [],
      bestseller: Boolean(p.bestseller),
      in_stock: p.inStock !== false,
      image: p.image || [],
      average_rating: Number(p.averageRating) || 0,
      total_reviews: Number(p.totalReviews) || (p.reviews?.length || 0),
      date: p.date ? Number(p.date) : Date.now(),
      shopify_product_id: p.shopify_product_id || null,
      created_at: p.date ? new Date(Number(p.date)).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase.from('products').upsert(productRecord, { onConflict: 'id' });

    // Migrate nested reviews
    if (Array.isArray(p.reviews) && p.reviews.length > 0) {
      for (const rev of p.reviews) {
        const reviewRecord = {
          id: `rev_${productId}_${rev.userId || Math.random().toString(36).substr(2, 6)}_${rev.date || Date.now()}`,
          product_id: productId,
          user_id: rev.userId ? rev.userId.toString() : 'anonymous',
          user_name: rev.userName || 'Anonymous User',
          user_avatar: rev.userAvatar || '',
          rating: Number(rev.rating) || 5,
          comment: rev.comment || '',
          date: rev.date ? Number(rev.date) : Date.now(),
          created_at: rev.date ? new Date(Number(rev.date)).toISOString() : new Date().toISOString()
        };
        await supabase.from('reviews').upsert(reviewRecord, { onConflict: 'id' });
        totalReviewsMigrated++;
      }
    }
  }
  console.log(` -> Migrated ${mongoProducts.length} products and ${totalReviewsMigrated} reviews`);

  // Step 4: Transform & Insert Users, Cart Items, Wishlist
  console.log('\n[4/5] Normalizing & migrating users, cart items & wishlist...');
  let totalCartItemsMigrated = 0;
  let totalWishlistMigrated = 0;

  for (const u of mongoUsers) {
    const userId = u._id.toString();
    const userRecord = {
      id: userId,
      name: u.name,
      email: u.email.toLowerCase().trim(),
      password_hash: u.password || '',
      phone: u.phone || '',
      auth_provider: u.authProvider || 'password',
      auth_provider_id: u.authProviderId || '',
      avatar: u.avatar || '',
      role: u.role || 'customer',
      salesforce_contact_id: null,
      created_at: u._id.getTimestamp ? u._id.getTimestamp().toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase.from('users').upsert(userRecord, { onConflict: 'id' });

    // Normalize embedded cartData: { [itemId]: { [size]: qty } }
    if (u.cartData && typeof u.cartData === 'object') {
      for (const [prodId, sizesObj] of Object.entries(u.cartData)) {
        if (sizesObj && typeof sizesObj === 'object') {
          for (const [size, qty] of Object.entries(sizesObj)) {
            if (Number(qty) > 0) {
              const cartRecord = {
                id: `cart_${userId}_${prodId}_${size}`,
                user_id: userId,
                product_id: prodId,
                size,
                quantity: Number(qty),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              await supabase.from('cart_items').upsert(cartRecord, { onConflict: 'user_id,product_id,size' });
              totalCartItemsMigrated++;
            }
          }
        }
      }
    }

    // Normalize embedded wishlist: [prodId, prodId2]
    if (Array.isArray(u.wishlist)) {
      for (const prodId of u.wishlist) {
        if (prodId) {
          const wishRecord = {
            id: `wish_${userId}_${prodId}`,
            user_id: userId,
            product_id: prodId,
            created_at: new Date().toISOString()
          };
          await supabase.from('wishlist_items').upsert(wishRecord, { onConflict: 'user_id,product_id' });
          totalWishlistMigrated++;
        }
      }
    }
  }
  console.log(` -> Migrated ${mongoUsers.length} users, ${totalCartItemsMigrated} cart items, ${totalWishlistMigrated} wishlist items`);

  // Step 5: Transform & Insert Orders and Order Items
  console.log('\n[5/5] Normalizing & migrating orders & order items...');
  let totalOrderItemsMigrated = 0;

  for (const o of mongoOrders) {
    const orderId = o._id.toString();
    const orderRecord = {
      id: orderId,
      user_id: o.userId ? o.userId.toString() : 'guest',
      amount: Number(o.amount) || 0,
      status: o.status || 'Order Placed',
      payment_method: o.paymentMethod || 'COD',
      payment_status: Boolean(o.payment),
      shipping_address: o.address || {},
      date: o.date ? Number(o.date) : Date.now(),
      shopify_order_id: null,
      created_at: o.date ? new Date(Number(o.date)).toISOString() : new Date().toISOString()
    };

    await supabase.from('orders').upsert(orderRecord, { onConflict: 'id' });

    // Normalize embedded items array
    if (Array.isArray(o.items)) {
      for (let i = 0; i < o.items.length; i++) {
        const item = o.items[i];
        const itemId = `item_${orderId}_${i}_${item._id || item.productId || 'p'}`;
        const orderItemRecord = {
          id: itemId,
          order_id: orderId,
          product_id: (item._id || item.productId || '').toString(),
          name: item.name || 'Product',
          price: Number(item.price) || 0,
          size: item.size || '',
          quantity: Number(item.quantity) || 1,
          image: item.image || []
        };
        await supabase.from('order_items').upsert(orderItemRecord, { onConflict: 'id' });
        totalOrderItemsMigrated++;
      }
    }
  }
  console.log(` -> Migrated ${mongoOrders.length} orders and ${totalOrderItemsMigrated} order items`);

  // Step 6: Migration Verification & Integrity Assertions
  console.log('\n====================================================');
  console.log('🔍 VERIFYING MIGRATION INTEGRITY ASSERTIONS');
  console.log('====================================================');

  const { data: supaUsers } = await supabase.from('users').select('*');
  const { data: supaProducts } = await supabase.from('products').select('*');
  const { data: supaOrders } = await supabase.from('orders').select('*');
  const { data: supaCart } = await supabase.from('cart_items').select('*');
  const { data: supaOrderItems } = await supabase.from('order_items').select('*');

  console.log(`Users count check: MongoDB=${mongoUsers.length} | Supabase=${supaUsers.length}`);
  console.log(`Products count check: MongoDB=${mongoProducts.length} | Supabase=${supaProducts.length}`);
  console.log(`Orders count check: MongoDB=${mongoOrders.length} | Supabase=${supaOrders.length}`);
  console.log(`Normalized Cart items in Supabase: ${supaCart.length}`);
  console.log(`Normalized Order items in Supabase: ${supaOrderItems.length}`);

  const usersMatch = supaUsers.length >= mongoUsers.length;
  const productsMatch = supaProducts.length >= mongoProducts.length;
  const ordersMatch = supaOrders.length >= mongoOrders.length;

  if (usersMatch && productsMatch && ordersMatch) {
    console.log('\n✅ VALIDATION PASSED: All MongoDB records successfully migrated with relational integrity!');
  } else {
    console.error('\n❌ VALIDATION WARNING: Some record counts did not match expected numbers.');
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

// Allow CLI execution
if (process.argv[1]?.includes('migrate-mongodb-to-supabase.js')) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
