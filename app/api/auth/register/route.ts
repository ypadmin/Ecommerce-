import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateToken } from "@/lib/simple-auth"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, confirmPassword, role } = await request.json()

    // Validation
    if (!username || !email || !password || !confirmPassword || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    if (!["admin", "cashier"].includes(role)) {
      return NextResponse.json({ error: "Invalid role selected" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users 
      WHERE username = ${username} OR email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 })
    }

    // For development, store plain text password in password_hash field
    // In production, use proper password hashing
    const passwordHash = password

    // Create new user
    const newUsers = await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (${username}, ${email}, ${passwordHash}, ${role})
      RETURNING id, username, email, role, created_at, updated_at
    `

    const newUser = newUsers[0]

    // Generate token for auto-login
    const token = generateToken(newUser.id, newUser.role)

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
