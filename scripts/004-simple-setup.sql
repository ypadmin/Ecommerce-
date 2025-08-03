-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing users
DELETE FROM users;

-- Insert simple test users (plain text passwords for development)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@store.com', 'admin123', 'admin'),
('cashier', 'cashier@store.com', 'cashier123', 'cashier');

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    image_url VARCHAR(500),
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    barcode VARCHAR(100),
    stock INTEGER NOT NULL DEFAULT 0,
    sizes TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50)
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES 
('T-Shirts', 'Casual and formal t-shirts'),
('Pants', 'Jeans, trousers, and casual pants'),
('Dresses', 'Formal and casual dresses'),
('Accessories', 'Belts, bags, and other accessories')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, cost_price, selling_price, stock, sizes, colors, category_id) VALUES 
('Basic T-Shirt', 50000, 80000, 100, ARRAY['S', 'M', 'L', 'XL'], ARRAY['White', 'Black', 'Blue'], 1),
('Jeans', 120000, 200000, 50, ARRAY['28', '30', '32', '34'], ARRAY['Blue', 'Black'], 2),
('Summer Dress', 80000, 150000, 30, ARRAY['S', 'M', 'L'], ARRAY['Red', 'Blue'], 3)
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Setup complete' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as product_count FROM products;
