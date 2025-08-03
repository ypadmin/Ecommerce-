import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/simple-auth"
import bcrypt from "bcryptjs"

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

    // Check if user is admin
    const currentUser = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (currentUser.length === 0 || currentUser[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const users = await sql`
      SELECT 
        id, 
        username, 
        email, 
        role, 
        created_at,
        (SELECT COUNT(*) FROM sales WHERE user_id = users.id) as total_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE user_id = users.id) as total_revenue
      FROM users 
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        totalSales: Number(user.total_sales || 0),
        totalRevenue: Number(user.total_revenue || 0),
      })),
    })
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
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

    // Check if user is admin
    const currentUser = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (currentUser.length === 0 || currentUser[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { username, email, password, role } = await request.json()

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if username or email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${username} OR email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await sql`
      INSERT INTO users (username, email, password, role)
      VALUES (${username}, ${email}, ${hashedPassword}, ${role})
      RETURNING id, username, email, role, created_at
    `

    return NextResponse.json({
      success: true,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        role: newUser[0].role,
        createdAt: newUser[0].created_at,
        totalSales: 0,
        totalRevenue: 0,
      },
    })
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
