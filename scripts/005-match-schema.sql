-- This script assumes your users table already exists with the correct structure
-- We'll just verify the structure and add any missing data

-- Verify the table structure matches what we see in the screenshot
-- The table should have: id, username, email, password_hash, role, created_at, updated_at, sales

-- Check if we have any test users, if not, add them
INSERT INTO users (username, email, password_hash, role) 
SELECT 'admin', 'admin@store.com', 'admin123', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (username, email, password_hash, role) 
SELECT 'cashier', 'cashier@store.com', 'cashier123', 'cashier'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'cashier');

-- Update the updated_at column for existing users if it's null
UPDATE users 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at IS NULL;

-- Initialize sales column to 0 if it's null
UPDATE users 
SET sales = 0 
WHERE sales IS NULL;

-- Verify the data
SELECT 'Users table verification:' as message;
SELECT id, username, email, role, created_at, updated_at, sales FROM users ORDER BY id;
