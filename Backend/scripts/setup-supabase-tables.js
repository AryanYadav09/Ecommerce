import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clear environment overrides so pg respects explicit pooler credentials
delete process.env.PGUSER;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;
delete process.env.PGPASSWORD;

async function setupTables() {
  console.log('====================================================');
  console.log('⚡ SETTING UP SUPABASE POSTGRESQL TABLES');
  console.log('====================================================');

  const client = new pg.Client({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.jzijljcvsfjbexcjvadh',
    password: 'ArYaN##3040',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase PostgreSQL (IPv4 Pooler port 6543)...');
  await client.connect();
  console.log('✅ Connected successfully to Supabase PostgreSQL Database!');

  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Executing schema.sql to create tables and indexes...');
  await client.query(sql);
  console.log('✅ All SQL tables, relationships, and indexes created successfully!');

  // Verify created tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('\nVerified Tables Created in Supabase Public Schema:');
  const tables = res.rows.map(r => r.table_name);
  tables.forEach(t => console.log(` ✔ ${t}`));

  await client.end();
  console.log('\nSetup completed successfully.');
  return tables;
}

setupTables()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error setting up Supabase tables:', err.message);
    process.exit(1);
  });
