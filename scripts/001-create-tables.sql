-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    image_url VARCHAR(500),
    cost_price DECIMAL(12,2) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    stock INTEGER NOT NULL DEFAULT 0,
    sizes TEXT[] DEFAULT '{}', -- Array of sizes
    colors TEXT[] DEFAULT '{}', -- Array of colors
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(200),
    logo_url VARCHAR(500),
    address TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'LAK',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
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

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@store.com', '$2b$10$rQZ8kHWKtGY5uFJ4uFJ4uOJ4uFJ4uFJ4uFJ4uFJ4uFJ4uFJ4uFJ4u', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default cashier user (password: cashier123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('cashier', 'cashier@store.com', '$2b$10$rQZ8kHWKtGY5uFJ4uFJ4uOJ4uFJ4uFJ4uFJ4uFJ4uFJ4uFJ4uFJ4u', 'cashier')
ON CONFLICT (username) DO NOTHING;

-- Insert default settings
INSERT INTO settings (store_name, address, tax_rate, currency)
VALUES ('Clothing Store', '123 Main Street, Vientiane, Laos', 10.00, 'LAK')
ON CONFLICT DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES 
('T-Shirts', 'Casual and formal t-shirts'),
('Pants', 'Jeans, trousers, and casual pants'),
('Dresses', 'Formal and casual dresses'),
('Accessories', 'Belts, bags, and other accessories'),
('Shoes', 'Footwear for all occasions'),
('Jackets', 'Outerwear and jackets')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, cost_price, selling_price, stock, sizes, colors, category_id) VALUES 
('Basic Cotton T-Shirt', 50000, 80000, 100, ARRAY['S', 'M', 'L', 'XL'], ARRAY['White', 'Black', 'Blue'], 1),
('Denim Jeans', 120000, 200000, 50, ARRAY['28', '30', '32', '34', '36'], ARRAY['Blue', 'Black'], 2),
('Summer Dress', 80000, 150000, 30, ARRAY['S', 'M', 'L'], ARRAY['Red', 'Blue', 'Yellow'], 3),
('Leather Belt', 30000, 60000, 25, ARRAY['S', 'M', 'L'], ARRAY['Brown', 'Black'], 4)
ON CONFLICT DO NOTHING;
