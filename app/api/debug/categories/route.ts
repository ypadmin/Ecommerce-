import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    await sql`SELECT 1`

    // Check if categories table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'categories'
      )
    `

    let categories = []
    let tableStructure = []

    if (tableExists[0].exists) {
      // Get table structure
      tableStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'categories'
        ORDER BY ordinal_position
      `

      // Get categories
      categories = await sql`
        SELECT * FROM categories ORDER BY id
      `
    }

    return NextResponse.json({
      success: true,
      database_connected: true,
      categories_table_exists: tableExists[0].exists,
      table_structure: tableStructure,
      categories_count: categories.length,
      categories: categories,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
