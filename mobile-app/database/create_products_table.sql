-- Products table for admin panel management
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 599,
    sizes TEXT[] DEFAULT ARRAY['250g', '500g', '1kg'],
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete to products" ON products;

-- Public read access for products (everyone can see products)
CREATE POLICY "Allow public read access to products" ON products
    FOR SELECT USING (true);

-- Authenticated users can manage products (in production, you'd restrict to admin only)
CREATE POLICY "Allow authenticated insert to products" ON products
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update to products" ON products
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete to products" ON products
    FOR DELETE TO authenticated USING (true);

-- Insert default product
INSERT INTO products (name, description, base_price, sizes, image_url, is_active)
VALUES (
    'Shadow Bean Signature Blend',
    'Our signature salt-air roasted coffee with zero bitterness',
    599,
    ARRAY['250g', '500g', '1kg'],
    '/product_bag.png',
    true
) ON CONFLICT DO NOTHING;

-- Create storage bucket for media if it doesn't exist
-- NOTE: This needs to be done via Supabase Dashboard under Storage > New Bucket
-- Bucket name: 'media'
-- Public: Yes (for public URL access)
