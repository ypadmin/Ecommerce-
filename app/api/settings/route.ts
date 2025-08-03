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

    // Ensure settings table exists
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
        logo_url TEXT,
        address TEXT NOT NULL DEFAULT 'Store Address',
        tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'LAK',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Get or create default settings
    let settings = await sql`SELECT * FROM settings ORDER BY id LIMIT 1`

    if (settings.length === 0) {
      // Create default settings
      settings = await sql`
        INSERT INTO settings (store_name, address, tax_rate, currency)
        VALUES ('Clothing Store', '123 Main Street, Vientiane, Laos', 10.00, 'LAK')
        RETURNING *
      `
    }

    return NextResponse.json({
      success: true,
      settings: settings[0],
    })
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { store_name, logo_url, address, tax_rate, currency } = await request.json()

    // Validation
    if (!store_name || !address) {
      return NextResponse.json({ error: "Store name and address are required" }, { status: 400 })
    }

    if (store_name.length > 255) {
      return NextResponse.json({ error: "Store name is too long (max 255 characters)" }, { status: 400 })
    }

    if (address.length > 1000) {
      return NextResponse.json({ error: "Address is too long (max 1000 characters)" }, { status: 400 })
    }

    if (logo_url && logo_url.length > 100000) {
      // 100KB limit for base64 images
      return NextResponse.json({ error: "Logo image is too large (max 100KB)" }, { status: 400 })
    }

    const taxRateNum = Number(tax_rate)
    if (isNaN(taxRateNum) || taxRateNum < 0 || taxRateNum > 100) {
      return NextResponse.json({ error: "Tax rate must be between 0 and 100" }, { status: 400 })
    }

    if (!currency || currency.length > 10) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 })
    }

    // Ensure settings table exists
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
        logo_url TEXT,
        address TEXT NOT NULL DEFAULT 'Store Address',
        tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'LAK',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Update or insert settings
    const existingSettings = await sql`SELECT id FROM settings LIMIT 1`

    let updatedSettings
    if (existingSettings.length > 0) {
      updatedSettings = await sql`
        UPDATE settings 
        SET 
          store_name = ${store_name},
          logo_url = ${logo_url || null},
          address = ${address},
          tax_rate = ${taxRateNum},
          currency = ${currency},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingSettings[0].id}
        RETURNING *
      `
    } else {
      updatedSettings = await sql`
        INSERT INTO settings (store_name, logo_url, address, tax_rate, currency)
        VALUES (${store_name}, ${logo_url || null}, ${address}, ${taxRateNum}, ${currency})
        RETURNING *
      `
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings[0],
    })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
