import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const users = await sql`
      SELECT id, username, email, role, created_at, updated_at, sales
      FROM users 
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      message: "Users retrieved successfully",
      count: users.length,
      users: users,
    })
  } catch (error) {
    console.error("Test users error:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
