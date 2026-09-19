import 'dotenv/config';
import pg from 'pg';

// Clear environment overrides so pg respects explicit pooler credentials
delete process.env.PGUSER;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;
delete process.env.PGPASSWORD;

async function enableRLS() {
  console.log('====================================================');
  console.log('⚡ ENABLING SUPABASE ROW LEVEL SECURITY (RLS)');
  console.log('====================================================');

  const client = new pg.Client({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.jzijljcvsfjbexcjvadh',
    password: 'ArYaN##3040',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('✅ Connected successfully!');

  const tables = [
    'categories',
    'products',
    'users',
    'pending_users',
    'cart_items',
    'wishlist_items',
    'orders',
    'order_items',
    'reviews',
    'user_events',
    'support_cases'
  ];

  console.log('\nEnabling Row Level Security on all tables...');
  for (const table of tables) {
    await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    console.log(` ✔ Enabled RLS on: ${table}`);
  }

  console.log('\nApplying policies and safe role grants...');
  const policySql = `
    -- Allow public read access to product catalog, categories, and reviews
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Public read products') THEN
        CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public read categories') THEN
        CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public read reviews') THEN
        CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
      END IF;
    END $$;

    -- Revoke unrestricted mutations from public/anon role
    REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

    -- Revoke all access from anon on private/sensitive user data tables
    REVOKE ALL ON public.users, public.pending_users, public.cart_items, public.wishlist_items, public.orders, public.order_items, public.user_events, public.support_cases FROM anon;

    -- Ensure service_role and authenticated access
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

    -- Allow anon to only SELECT from public catalog tables
    GRANT SELECT ON public.categories, public.products, public.reviews TO anon;

    -- Refresh schema cache
    NOTIFY pgrst, 'reload schema';
  `;

  await client.query(policySql);
  console.log('✅ Security policies and role privileges configured successfully!');

  // Verify status
  const res = await client.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);

  console.log('\nVerification of Row Level Security status:');
  console.table(res.rows);

  const polRes = await client.query(`
    SELECT tablename, policyname, cmd 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  console.log('\nVerification of active RLS policies:');
  console.table(polRes.rows);

  await client.end();
  console.log('\n🎉 RLS setup and security remediation completed successfully!');
}

enableRLS().catch(err => {
  console.error('❌ Error enabling RLS:', err);
  process.exit(1);
});
