import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/simple-auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Ensure products table exists with correct column types
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        image_url TEXT,
        cost_price DECIMAL(12,2) NOT NULL,
        selling_price DECIMAL(12,2) NOT NULL,
        barcode VARCHAR(100) UNIQUE,
        stock INTEGER NOT NULL DEFAULT 0,
        sizes TEXT[] DEFAULT '{}',
        colors TEXT[] DEFAULT '{}',
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Fix existing table if image_url column is VARCHAR
    try {
      await sql`ALTER TABLE products ALTER COLUMN image_url TYPE TEXT`
    } catch (error) {
      // Column might already be TEXT or table might not exist yet
      console.log("Column type change not needed or already applied")
    }

    const products = await sql`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `

    const formattedProducts = products.map((product) => ({
      ...product,
      category: product.category_name ? { name: product.category_name } : null,
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    let requestData
    try {
      requestData = await request.json()
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 })
    }

    const { name, image_url, cost_price, selling_price, barcode, stock, sizes, colors, category_id } = requestData

    // Validation
    if (!name || cost_price === undefined || selling_price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Required fields missing: name, cost_price, selling_price, stock" },
        { status: 400 },
      )
    }

    if (isNaN(Number(cost_price)) || isNaN(Number(selling_price)) || isNaN(Number(stock))) {
      return NextResponse.json({ error: "Price and stock must be valid numbers" }, { status: 400 })
    }

    if (Number(cost_price) < 0 || Number(selling_price) < 0 || Number(stock) < 0) {
      return NextResponse.json({ error: "Price and stock cannot be negative" }, { status: 400 })
    }

    // Validate image size (base64 images can be very large)
    if (image_url && image_url.length > 10 * 1024 * 1024) {
      // 10MB limit
      return NextResponse.json({ error: "Image is too large. Please use an image smaller than 10MB." }, { status: 400 })
    }

    // Ensure products table exists with correct column types
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        image_url TEXT,
        cost_price DECIMAL(12,2) NOT NULL,
        selling_price DECIMAL(12,2) NOT NULL,
        barcode VARCHAR(100) UNIQUE,
        stock INTEGER NOT NULL DEFAULT 0,
        sizes TEXT[] DEFAULT '{}',
        colors TEXT[] DEFAULT '{}',
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Fix existing table if image_url column is VARCHAR
    try {
      await sql`ALTER TABLE products ALTER COLUMN image_url TYPE TEXT`
    } catch (error) {
      // Column might already be TEXT
      console.log("Column type change not needed or already applied")
    }

    // Handle barcode uniqueness
    if (barcode) {
      const existingProduct = await sql`
        SELECT id FROM products WHERE barcode = ${barcode}
      `
      if (existingProduct.length > 0) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 409 })
      }
    }

    console.log("Creating product with image_url length:", image_url ? image_url.length : 0)

    const newProducts = await sql`
      INSERT INTO products (
        name, image_url, cost_price, selling_price, barcode, stock, sizes, colors, category_id
      )
      VALUES (
        ${name}, 
        ${image_url || null}, 
        ${Number(cost_price)}, 
        ${Number(selling_price)}, 
        ${barcode || null}, 
        ${Number(stock)}, 
        ${Array.isArray(sizes) ? sizes : []}, 
        ${Array.isArray(colors) ? colors : []}, 
        ${category_id ? Number(category_id) : null}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product: newProducts[0],
    })
  } catch (error) {
    console.error("Product creation error:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("value too long")) {
        return NextResponse.json(
          {
            error: "Image data is too large. Please use a smaller image or compress it.",
          },
          { status: 400 },
        )
      }
      if (error.message.includes("duplicate key")) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 409 })
      }
      if (error.message.includes("foreign key")) {
        return NextResponse.json({ error: "Invalid category selected" }, { status: 400 })
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
