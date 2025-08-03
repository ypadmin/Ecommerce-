-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing users
DELETE FROM users WHERE username IN ('admin', 'cashier');

-- Insert test users with bcrypt hashed passwords
-- admin123 hashed with bcrypt rounds=12
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@store.com', '$2b$12$LQv3c1yqBw2uuCD4MicOyuFsAHgr.Oa.kZrwGOAwtbud9xyGWzLHu', 'admin');

-- cashier123 hashed with bcrypt rounds=12  
INSERT INTO users (username, email, password_hash, role) VALUES 
('cashier', 'cashier@store.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier');

-- Create other tables
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    image_url VARCHAR(500),
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

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Insert sample data
INSERT INTO categories (name, description) VALUES 
('T-Shirts', 'Casual and formal t-shirts'),
('Pants', 'Jeans, trousers, and casual pants'),
('Dresses', 'Formal and casual dresses'),
('Accessories', 'Belts, bags, and other accessories')
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (store_name, address, tax_rate, currency)
VALUES ('Clothing Store', '123 Main Street, Vientiane, Laos', 10.00, 'LAK')
ON CONFLICT DO NOTHING;

-- Verify users were created
SELECT 'Users created:' as message, COUNT(*) as count FROM users;
SELECT username, email, role FROM users;
