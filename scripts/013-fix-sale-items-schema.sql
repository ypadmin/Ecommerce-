-- Check and fix sale_items table structure
DO $$ 
BEGIN
    -- Add unit_price column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sale_items' AND column_name = 'unit_price') THEN
        ALTER TABLE sale_items ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Update existing records to have unit_price from products table
    UPDATE sale_items si 
    SET unit_price = p.selling_price 
    FROM products p 
    WHERE si.product_id = p.id AND si.unit_price = 0;
    
    -- Add indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
END $$;
