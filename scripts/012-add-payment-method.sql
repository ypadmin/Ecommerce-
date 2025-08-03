-- Add payment_method column to sales table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'payment_method') THEN
        ALTER TABLE sales ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
    END IF;
END $$;

-- Update existing sales records to have a payment method
UPDATE sales SET payment_method = 'cash' WHERE payment_method IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
