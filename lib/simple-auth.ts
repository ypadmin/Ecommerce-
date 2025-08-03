import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { sql } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: number
  username: string
  email: string
  role: "admin" | "cashier"
  created_at: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User
    return decoded
  } catch (error) {
    return null
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const decoded = verifyToken(token)
  if (!decoded) return null

  try {
    // Check if users table exists first
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `

    if (!tableExists[0]?.exists) {
      return null
    }

    const users = await sql`
      SELECT id, username, email, role, created_at 
      FROM users 
      WHERE id = ${decoded.id}
    `

    return (users[0] as User) || null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function createUser(
  username: string,
  email: string,
  password: string,
  role: "admin" | "cashier" = "cashier",
): Promise<User> {
  const hashedPassword = await hashPassword(password)

  const users = await sql`
    INSERT INTO users (username, email, password, role)
    VALUES (${username}, ${email}, ${hashedPassword}, ${role})
    RETURNING id, username, email, role, created_at
  `

  return users[0] as User
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    // Check if users table exists first
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `

    if (!tableExists[0]?.exists) {
      return null
    }

    const users = await sql`
      SELECT id, username, email, password, role, created_at 
      FROM users 
      WHERE email = ${email}
    `

    const user = users[0]
    if (!user) return null

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) return null

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}
