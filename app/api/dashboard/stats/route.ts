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

    // Get total products
    const productCount = await sql`SELECT COUNT(*) as count FROM products`
    const totalProducts = Number.parseInt(productCount[0].count)

    // Get total users
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const totalUsers = Number.parseInt(userCount[0].count)

    // Get today's sales count
    const todaySalesCount = await sql`
      SELECT COUNT(*) as count 
      FROM sales 
      WHERE DATE(created_at) = CURRENT_DATE
    `
    const todaySales = Number.parseInt(todaySalesCount[0].count)

    // Get total revenue
    const revenueResult = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM sales
    `
    const totalRevenue = Number.parseFloat(revenueResult[0].total)

    return NextResponse.json({
      success: true,
      totalProducts,
      totalUsers,
      todaySales,
      totalRevenue,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        totalProducts: 0,
        totalUsers: 0,
        todaySales: 0,
        totalRevenue: 0,
      },
      { status: 500 },
    )
  }
}
