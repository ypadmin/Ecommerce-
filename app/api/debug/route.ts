import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check database connection
    const connectionTest = await sql`SELECT NOW() as current_time`

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    // Get table structures
    const tableStructures: any = {}

    for (const table of tables) {
      try {
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${table.table_name}
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `
        tableStructures[table.table_name] = columns
      } catch (error) {
        tableStructures[table.table_name] = { error: error.message }
      }
    }

    // Try to get sample data from each table
    const sampleData: any = {}

    for (const table of tables) {
      try {
        const data = await sql`SELECT * FROM ${sql(table.table_name)} LIMIT 3`
        sampleData[table.table_name] = data
      } catch (error) {
        sampleData[table.table_name] = { error: error.message }
      }
    }

    return NextResponse.json({
      status: "Database connection successful",
      timestamp: connectionTest[0].current_time,
      tables: tables.map((t) => t.table_name),
      tableStructures,
      sampleData,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        status: "Database connection failed",
        error: error.message,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL_SET: !!process.env.DATABASE_URL,
          JWT_SECRET_SET: !!process.env.JWT_SECRET,
        },
      },
      { status: 500 },
    )
  }
}
