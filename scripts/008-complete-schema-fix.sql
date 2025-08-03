-- Complete schema setup with correct column types for images

-- Drop and recreate products table with correct column types
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Recreate products table with TEXT for image_url
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    image_url TEXT, -- Changed from VARCHAR(500) to TEXT
    cost_price DECIMAL(12,2) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    stock INTEGER NOT NULL DEFAULT 0,
    sizes TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate sale_items table
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Insert sample products with proper image handling
INSERT INTO products (name, cost_price, selling_price, stock, sizes, colors, category_id) VALUES 
('Basic Cotton T-Shirt', 50000, 80000, 100, ARRAY['S', 'M', 'L', 'XL'], ARRAY['White', 'Black', 'Blue'], 1),
('Denim Jeans', 120000, 200000, 50, ARRAY['28', '30', '32', '34', '36'], ARRAY['Blue', 'Black'], 2),
('Summer Dress', 80000, 150000, 30, ARRAY['S', 'M', 'L'], ARRAY['Red', 'Blue', 'Yellow'], 3),
('Leather Belt', 30000, 60000, 25, ARRAY['S', 'M', 'L'], ARRAY['Brown', 'Black'], 4)
ON CONFLICT DO NOTHING;

-- Verify the schema
SELECT 
    table_name, 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('products', 'sales', 'sale_items')
ORDER BY table_name, ordinal_position;

-- Show success message
SELECT 'Schema updated successfully. Products table now uses TEXT for image_url column.' as message;
