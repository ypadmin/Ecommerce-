import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/simple-auth"
import bcrypt from "bcryptjs"

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

    // Check if user is admin
    const currentUser = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (currentUser.length === 0 || currentUser[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { username, email, password, role } = await request.json()
    const userId = Number.parseInt(params.id)

    if (!username || !email || !role) {
      return NextResponse.json({ error: "Username, email, and role are required" }, { status: 400 })
    }

    // Check if username or email already exists (excluding current user)
    const existingUser = await sql`
      SELECT id FROM users 
      WHERE (username = ${username} OR email = ${email}) 
      AND id != ${userId}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }

    let updateQuery
    if (password) {
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10)
      updateQuery = sql`
        UPDATE users 
        SET username = ${username}, email = ${email}, password = ${hashedPassword}, role = ${role}
        WHERE id = ${userId}
        RETURNING id, username, email, role, created_at
      `
    } else {
      updateQuery = sql`
        UPDATE users 
        SET username = ${username}, email = ${email}, role = ${role}
        WHERE id = ${userId}
        RETURNING id, username, email, role, created_at
      `
    }

    const updatedUser = await updateQuery

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user stats
    const userStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM sales WHERE user_id = ${userId}) as total_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE user_id = ${userId}) as total_revenue
    `

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser[0].id,
        username: updatedUser[0].username,
        email: updatedUser[0].email,
        role: updatedUser[0].role,
        createdAt: updatedUser[0].created_at,
        totalSales: Number(userStats[0]?.total_sales || 0),
        totalRevenue: Number(userStats[0]?.total_revenue || 0),
      },
    })
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
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

    // Check if user is admin
    const currentUser = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (currentUser.length === 0 || currentUser[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)

    // Prevent deleting self
    if (userId === decoded.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if user exists
    const userExists = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (userExists.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user (sales will be kept for historical purposes)
    await sql`
      DELETE FROM users WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("User deletion error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
