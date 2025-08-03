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

    // Get user profile with stats
    const userProfile = await sql`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id) as total_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE user_id = u.id) as total_revenue
      FROM users u
      WHERE u.id = ${decoded.userId}
    `

    if (userProfile.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userProfile[0]

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        totalSales: Number(user.total_sales || 0),
        totalRevenue: Number(user.total_revenue || 0),
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
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

    const { username, email, currentPassword, newPassword } = await request.json()

    if (!username || !email) {
      return NextResponse.json({ error: "Username and email are required" }, { status: 400 })
    }

    // Check if username or email already exists (excluding current user)
    const existingUser = await sql`
      SELECT id FROM users 
      WHERE (username = ${username} OR email = ${email}) 
      AND id != ${decoded.userId}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 })
      }

      const currentUser = await sql`
        SELECT password FROM users WHERE id = ${decoded.userId}
      `

      if (currentUser.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, currentUser[0].password)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await sql`
        UPDATE users 
        SET username = ${username}, email = ${email}, password = ${hashedPassword}
        WHERE id = ${decoded.userId}
      `
    } else {
      // Update without password change
      await sql`
        UPDATE users 
        SET username = ${username}, email = ${email}
        WHERE id = ${decoded.userId}
      `
    }

    // Get updated user profile with stats
    const updatedProfile = await sql`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id) as total_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE user_id = u.id) as total_revenue
      FROM users u
      WHERE u.id = ${decoded.userId}
    `

    const user = updatedProfile[0]

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        totalSales: Number(user.total_sales || 0),
        totalRevenue: Number(user.total_revenue || 0),
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
