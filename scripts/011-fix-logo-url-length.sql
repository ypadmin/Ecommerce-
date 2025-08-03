-- Fix logo_url column length issue
ALTER TABLE settings ALTER COLUMN logo_url TYPE TEXT;

-- Ensure settings table exists with correct structure
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
  logo_url TEXT,
  address TEXT NOT NULL DEFAULT 'Store Address',
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'LAK',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings if none exist
INSERT INTO settings (store_name, address, tax_rate, currency)
SELECT 'Clothing Store', '123 Main Street, Vientiane, Laos', 10.00, 'LAK'
WHERE NOT EXISTS (SELECT 1 FROM settings);
