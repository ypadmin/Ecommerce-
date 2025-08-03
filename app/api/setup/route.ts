import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          cost DECIMAL(10,2) DEFAULT 0,
          stock_quantity INTEGER DEFAULT 0,
          min_stock_level INTEGER DEFAULT 5,
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          barcode VARCHAR(100) UNIQUE,
          image_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create sales table
    await sql`
      CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          tax_amount DECIMAL(10,2) DEFAULT 0,
          discount_amount DECIMAL(10,2) DEFAULT 0,
          payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer')),
          status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create sale_items table
    await sql`
      CREATE TABLE IF NOT EXISTS sale_items (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
          product_name VARCHAR(200) NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Insert default settings
    await sql`
      INSERT INTO settings (key, value, description) VALUES
      ('store_name', 'POS System', 'Store name displayed in the application'),
      ('store_address', '', 'Store physical address'),
      ('store_phone', '', 'Store contact phone number'),
      ('store_email', '', 'Store contact email address'),
      ('tax_rate', '0.10', 'Default tax rate (10%)'),
      ('currency', 'LAK', 'Store currency'),
      ('logo_url', '', 'Store logo URL'),
      ('receipt_footer', 'Thank you for your business!', 'Footer text on receipts'),
      ('low_stock_threshold', '5', 'Minimum stock level for alerts')
      ON CONFLICT (key) DO NOTHING
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`
    await sql`CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)`

    // Insert sample categories
    await sql`
      INSERT INTO categories (name, description) VALUES
      ('Electronics', 'Electronic devices and accessories'),
      ('Clothing', 'Apparel and fashion items'),
      ('Food & Beverages', 'Food and drink products'),
      ('Books', 'Books and educational materials'),
      ('Home & Garden', 'Home improvement and garden supplies')
      ON CONFLICT DO NOTHING
    `

    // Insert sample products
    await sql`
      INSERT INTO products (name, description, price, cost, stock_quantity, category_id, barcode) VALUES
      ('Smartphone', 'Latest model smartphone', 2500000, 2000000, 10, 1, '1234567890123'),
      ('T-Shirt', 'Cotton t-shirt', 150000, 100000, 25, 2, '2345678901234'),
      ('Coffee', 'Premium coffee beans', 80000, 60000, 50, 3, '3456789012345'),
      ('Novel Book', 'Bestselling novel', 120000, 80000, 15, 4, '4567890123456'),
      ('Garden Tool', 'Multi-purpose garden tool', 200000, 150000, 8, 5, '5678901234567')
      ON CONFLICT (barcode) DO NOTHING
    `

    // Create admin user (password: admin123)
    const hashedPassword = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa"
    await sql`
      INSERT INTO users (username, email, password, role) VALUES
      ('admin', 'admin@store.com', ${hashedPassword}, 'admin')
      ON CONFLICT (email) DO NOTHING
    `

    return NextResponse.json({
      message: "Database setup completed successfully",
      tables_created: ["users", "categories", "products", "sales", "sale_items", "settings"],
      sample_data_inserted: true,
      admin_user_created: {
        email: "admin@store.com",
        password: "admin123",
      },
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      {
        error: "Database setup failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
