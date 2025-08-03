-- Fix the image_url column to handle base64 data
-- Change from VARCHAR(500) to TEXT to accommodate base64 encoded images

-- Update the products table to use TEXT for image_url
ALTER TABLE products ALTER COLUMN image_url TYPE TEXT;

-- Verify the change
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url';

-- Show current products table structure
\d products;
