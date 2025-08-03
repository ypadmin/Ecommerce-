import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Test basic connection
    await sql`SELECT 1`

    // Get users with correct column names
    const users = await sql`
      SELECT id, username, email, role, created_at, updated_at, sales
      FROM users 
      ORDER BY id
    `

    return NextResponse.json({
      success: true,
      database_connected: true,
      users_table_exists: true,
      user_count: users.length,
      users: users,
      sample_users: users.slice(0, 5), // Show first 5 users
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        database_connected: false,
        users_table_exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
