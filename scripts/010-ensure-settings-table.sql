-- Ensure settings table exists with correct structure
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(200),
    logo_url VARCHAR(500),
    address TEXT,
    tax_rate NUMERIC DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'LAK',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings if none exist
INSERT INTO settings (store_name, address, tax_rate, currency)
SELECT 'Clothing Store', '123 Main Street, Vientiane, Laos', 10.00, 'LAK'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Verify settings table
SELECT 'Settings table ready:' as message;
SELECT * FROM settings;
