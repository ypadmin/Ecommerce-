import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sql } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string }
  } catch {
    return null
  }
}

export async function getUserById(id: number) {
  const users = await sql`
    SELECT id, username, email, role, created_at 
    FROM users 
    WHERE id = ${id}
  `
  return users[0] || null
}
