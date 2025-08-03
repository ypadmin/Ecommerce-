import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/simple-auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = params.id
    if (!productId || isNaN(Number(productId))) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
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

    // Ensure the image_url column is TEXT type
    try {
      await sql`ALTER TABLE products ALTER COLUMN image_url TYPE TEXT`
    } catch (error) {
      // Column might already be TEXT
      console.log("Column type change not needed or already applied")
    }

    // Check if product exists
    const existingProduct = await sql`
      SELECT id FROM products WHERE id = ${productId}
    `

    if (existingProduct.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Handle barcode uniqueness (exclude current product)
    if (barcode) {
      const duplicateBarcode = await sql`
        SELECT id FROM products WHERE barcode = ${barcode} AND id != ${productId}
      `
      if (duplicateBarcode.length > 0) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 409 })
      }
    }

    console.log("Updating product with image_url length:", image_url ? image_url.length : 0)

    const updatedProducts = await sql`
      UPDATE products 
      SET 
        name = ${name},
        image_url = ${image_url || null},
        cost_price = ${Number(cost_price)},
        selling_price = ${Number(selling_price)},
        barcode = ${barcode || null},
        stock = ${Number(stock)},
        sizes = ${Array.isArray(sizes) ? sizes : []},
        colors = ${Array.isArray(colors) ? colors : []},
        category_id = ${category_id ? Number(category_id) : null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${productId}
      RETURNING *
    `

    if (updatedProducts.length === 0) {
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProducts[0],
    })
  } catch (error) {
    console.error("Product update error:", error)

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
        error: "Failed to update product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = params.id
    if (!productId || isNaN(Number(productId))) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    // Check if product exists
    const existingProduct = await sql`
      SELECT id FROM products WHERE id = ${productId}
    `

    if (existingProduct.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if product is used in any sales
    const salesWithProduct = await sql`
      SELECT COUNT(*) as count FROM sale_items WHERE product_id = ${productId}
    `

    if (Number(salesWithProduct[0].count) > 0) {
      return NextResponse.json({ error: "Cannot delete product that has been sold" }, { status: 400 })
    }

    const deletedProducts = await sql`
      DELETE FROM products 
      WHERE id = ${productId}
      RETURNING id
    `

    if (deletedProducts.length === 0) {
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Product deletion error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
