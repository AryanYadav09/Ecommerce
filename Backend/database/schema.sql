-- ==============================================================================
-- Supabase PostgreSQL Relational Schema for Headless E-Commerce Platform
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
    bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    image JSONB NOT NULL DEFAULT '[]'::jsonb,
    average_rating NUMERIC(3, 1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    date BIGINT,
    shopify_product_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    auth_provider TEXT DEFAULT 'password',
    auth_provider_id TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    role TEXT DEFAULT 'customer',
    salesforce_contact_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pending Users Table (Email OTP signup stage)
CREATE TABLE IF NOT EXISTS pending_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    otp_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cart Items Table (Normalized relational cart)
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_product_size UNIQUE (user_id, product_id, size)
);

-- 6. Wishlist Items Table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_wishlist_product UNIQUE (user_id, product_id)
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Order Placed',
    payment_method TEXT NOT NULL,
    payment_status BOOLEAN NOT NULL DEFAULT FALSE,
    shipping_address JSONB NOT NULL,
    date BIGINT NOT NULL,
    shopify_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    size TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    image JSONB DEFAULT '[]'::jsonb
);

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT DEFAULT '',
    rating NUMERIC(2, 1) NOT NULL,
    comment TEXT DEFAULT '',
    date BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Behavioral User Events (For AI Recommendation & Analytics)
CREATE TABLE IF NOT EXISTS user_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    product_id TEXT,
    event_type TEXT NOT NULL, -- 'view', 'search', 'add_to_cart', 'purchase', 'wishlist'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Customer Support Cases (Integrated with Salesforce CRM)
CREATE TABLE IF NOT EXISTS support_cases (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'New',
    salesforce_case_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products(bestseller);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_support_cases_email ON support_cases(email);
