-- ==============================================
-- SHADOW BEAN CO - RDS PostgreSQL Schema
-- ==============================================
-- Complete schema mirroring Supabase tables.
-- Target: Amazon Aurora PostgreSQL Serverless v2
-- Run after RDS cluster is provisioned.
-- ==============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- PROFILES
-- ==============================================
CREATE TABLE profiles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_sub VARCHAR(255) UNIQUE,  -- AWS Cognito user sub
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) DEFAULT '',
    avatar_url  TEXT,
    phone       VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_cognito_sub ON profiles(cognito_sub);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ==============================================
-- ADMIN USERS
-- ==============================================
CREATE TABLE admin_users (
    id         SERIAL PRIMARY KEY,
    user_id    VARCHAR(255) NOT NULL UNIQUE,  -- Cognito sub or admin ID
    email      VARCHAR(255),
    role       VARCHAR(50) NOT NULL DEFAULT 'admin',
    is_active  BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);

-- ==============================================
-- PRODUCTS
-- ==============================================
CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    base_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    sizes       JSONB DEFAULT '[]'::jsonb,
    image_url   TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- ==============================================
-- TASTE PROFILES
-- ==============================================
CREATE TABLE taste_profiles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    bitterness  INTEGER NOT NULL DEFAULT 3 CHECK (bitterness BETWEEN 1 AND 5),
    acidity     INTEGER NOT NULL DEFAULT 3 CHECK (acidity BETWEEN 1 AND 5),
    body        INTEGER NOT NULL DEFAULT 3 CHECK (body BETWEEN 1 AND 5),
    flavour     INTEGER NOT NULL DEFAULT 3 CHECK (flavour BETWEEN 1 AND 5),
    roast_level VARCHAR(50) NOT NULL DEFAULT 'Medium',
    grind_type  VARCHAR(50) NOT NULL DEFAULT 'Whole Bean',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_taste_profiles_user ON taste_profiles(user_id);

-- ==============================================
-- ADDRESSES
-- ==============================================
CREATE TABLE addresses (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label        VARCHAR(100) DEFAULT 'Home',
    full_name    VARCHAR(255),
    phone        VARCHAR(50),
    address_line VARCHAR(500) NOT NULL,
    city         VARCHAR(100) NOT NULL,
    state        VARCHAR(100) NOT NULL,
    pincode      VARCHAR(20) NOT NULL,
    country      VARCHAR(100) DEFAULT 'India',
    is_default   BOOLEAN DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ==============================================
-- ORDERS
-- ==============================================
CREATE TABLE orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    status                  VARCHAR(50) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    total_amount            DECIMAL(10,2) NOT NULL DEFAULT 0,
    razorpay_payment_id     VARCHAR(255),
    razorpay_order_id       VARCHAR(255),
    shipping_address        JSONB,
    shiprocket_order_id     VARCHAR(255),
    shiprocket_shipment_id  VARCHAR(255),
    tracking_url            TEXT,
    cancellation_reason     TEXT,
    cancelled_at            TIMESTAMPTZ,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_razorpay ON orders(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

-- ==============================================
-- ORDER ITEMS
-- ==============================================
CREATE TABLE order_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    taste_profile_id    UUID REFERENCES taste_profiles(id) ON DELETE SET NULL,
    taste_profile_name  VARCHAR(255),
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
    size                VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ==============================================
-- REVIEWS
-- ==============================================
CREATE TABLE reviews (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    user_name    VARCHAR(255),
    rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    is_approved  BOOLEAN DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;

-- ==============================================
-- PRICING
-- ==============================================
CREATE TABLE pricing (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255),
    description     TEXT,
    base_price      DECIMAL(10,2),
    size_100g       DECIMAL(10,2),
    size_250g       DECIMAL(10,2),
    size_500g       DECIMAL(10,2),
    size_1kg        DECIMAL(10,2),
    discount_pct    DECIMAL(5,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_active ON pricing(is_active) WHERE is_active = true;

-- ==============================================
-- TERMS AND CONDITIONS
-- ==============================================
CREATE TABLE terms_and_conditions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content    TEXT NOT NULL,
    version    INTEGER NOT NULL DEFAULT 1,
    is_active  BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_terms_active ON terms_and_conditions(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_terms_version ON terms_and_conditions(version);

-- ==============================================
-- APP ASSETS (Media management)
-- ==============================================
CREATE TABLE app_assets (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key        VARCHAR(255) NOT NULL UNIQUE,
    url        TEXT NOT NULL,
    title      VARCHAR(255),
    type       VARCHAR(50) DEFAULT 'image',
    category   VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_key ON app_assets(key);
CREATE INDEX idx_assets_category ON app_assets(category);

-- ==============================================
-- NOTIFICATIONS (new - for order updates)
-- ==============================================
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL DEFAULT 'info',
    title      VARCHAR(255) NOT NULL,
    message    TEXT,
    is_read    BOOLEAN DEFAULT false,
    metadata   JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ==============================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_taste_profiles_updated_at BEFORE UPDATE ON taste_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pricing_updated_at BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON app_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================
-- VERIFICATION
-- ==============================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
