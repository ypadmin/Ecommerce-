import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/simple-auth"

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
      console.error("JSON parse error in sales:", parseError)
      return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 })
    }

    console.log("Received sale request data:", JSON.stringify(requestData, null, 2))

    const { items, total_amount, tax_amount, payment_method } = requestData

    // Enhanced validation with detailed logging
    console.log("Validating sale data:")
    console.log("- items:", items)
    console.log("- total_amount:", total_amount, "type:", typeof total_amount)
    console.log("- tax_amount:", tax_amount, "type:", typeof tax_amount)
    console.log("- payment_method:", payment_method)

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("Validation failed: No items in cart")
      return NextResponse.json({ error: "No items in cart" }, { status: 400 })
    }

    // More detailed total_amount validation
    if (total_amount === undefined || total_amount === null) {
      console.error("Validation failed: total_amount is undefined or null")
      return NextResponse.json({ error: "Total amount is required" }, { status: 400 })
    }

    const totalAmountNum = Number(total_amount)
    if (isNaN(totalAmountNum)) {
      console.error("Validation failed: total_amount is NaN:", total_amount)
      return NextResponse.json({ error: "Total amount must be a valid number" }, { status: 400 })
    }

    if (totalAmountNum <= 0) {
      console.error("Validation failed: total_amount is <= 0:", totalAmountNum)
      return NextResponse.json({ error: "Total amount must be greater than 0" }, { status: 400 })
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log(`Validating item ${i}:`, item)

      if (!item.product_id || !item.quantity || !item.unit_price || item.total_price === undefined) {
        console.error(`Item ${i} validation failed: Missing required fields`)
        return NextResponse.json({ error: `Item ${i + 1}: Missing required fields` }, { status: 400 })
      }

      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unit_price)
      const totalPrice = Number(item.total_price)

      if (isNaN(quantity) || quantity <= 0) {
        console.error(`Item ${i} validation failed: Invalid quantity`)
        return NextResponse.json(
          { error: `Item ${i + 1} (${item.name || item.product_id}): Invalid quantity` },
          { status: 400 },
        )
      }

      if (isNaN(unitPrice) || unitPrice <= 0) {
        console.error(`Item ${i} validation failed: Invalid unit price`)
        return NextResponse.json(
          { error: `Item ${i + 1} (${item.name || item.product_id}): Invalid unit price` },
          { status: 400 },
        )
      }

      if (isNaN(totalPrice) || totalPrice <= 0) {
        console.error(`Item ${i} validation failed: Invalid total price`)
        return NextResponse.json(
          { error: `Item ${i + 1} (${item.name || item.product_id}): Invalid total price` },
          { status: 400 },
        )
      }
    }

    console.log("All validations passed, processing sale...")

    // Check stock availability for all items first
    for (const item of items) {
      const products = await sql`
        SELECT id, name, stock FROM products WHERE id = ${item.product_id}
      `

      if (products.length === 0) {
        return NextResponse.json({ error: `Product with ID ${item.product_id} not found` }, { status: 400 })
      }

      const product = products[0]
      const currentStock = Number(product.stock)
      const requestedQuantity = Number(item.quantity)

      if (currentStock < requestedQuantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for product "${product.name}". Available: ${currentStock}, Requested: ${requestedQuantity}`,
          },
          { status: 400 },
        )
      }
    }

    // Create sale record
    const newSales = await sql`
      INSERT INTO sales (user_id, total_amount, tax_amount)
      VALUES (${decoded.userId}, ${totalAmountNum}, ${Number(tax_amount) || 0})
      RETURNING *
    `

    const sale = newSales[0]
    const saleId = sale.id
    console.log("Created sale with ID:", saleId)

    // Process each item (insert sale items and update stock)
    for (const item of items) {
      // Insert sale item
      await sql`
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, size, color)
        VALUES (
          ${saleId}, 
          ${item.product_id}, 
          ${Number(item.quantity)}, 
          ${Number(item.unit_price)}, 
          ${Number(item.total_price)},
          ${item.size || null},
          ${item.color || null}
        )
      `

      // Update product stock
      await sql`
        UPDATE products 
        SET stock = stock - ${Number(item.quantity)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${item.product_id}
      `

      console.log(`Updated stock for product ${item.product_id}: -${item.quantity}`)
    }

    console.log("Sale completed successfully:", sale.id)

    return NextResponse.json({
      success: true,
      message: "Sale completed successfully",
      sale_id: sale.id,
      sale: sale,
      total_amount: sale.total_amount,
    })
  } catch (error) {
    console.error("Sale processing error:", error)

    // Always return JSON, even for errors
    const errorMessage = error instanceof Error ? error.message : "Internal server error"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500 },
    )
  }
}

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

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const sales = await sql`
      SELECT 
        s.*,
        u.username,
        COUNT(si.id)::integer as item_count
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id, u.username
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return NextResponse.json({
      success: true,
      sales: sales,
    })
  } catch (error) {
    console.error("Sales fetch error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sales",
        sales: [],
      },
      { status: 500 },
    )
  }
}
