-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample categories if the table is empty
INSERT INTO categories (name, description) 
SELECT 'T-Shirts', 'Casual and formal t-shirts'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'T-Shirts');

INSERT INTO categories (name, description) 
SELECT 'Pants', 'Jeans, trousers, and casual pants'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pants');

INSERT INTO categories (name, description) 
SELECT 'Dresses', 'Formal and casual dresses'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dresses');

INSERT INTO categories (name, description) 
SELECT 'Accessories', 'Belts, bags, and other accessories'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Accessories');

-- Verify the categories
SELECT 'Categories created successfully:' as message;
SELECT id, name, description, created_at FROM categories ORDER BY id;
