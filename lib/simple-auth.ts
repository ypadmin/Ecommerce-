import { sql } from "./db"

// Simple hash function for development (replace with proper hashing in production)
function simpleHash(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString()
}

export async function hashPassword(password: string): Promise<string> {
  // For development, we'll use simple hashing
  // In production, use proper password hashing like bcrypt
  return simpleHash(password)
}

export async function verifyPassword(password: string, storedPasswordHash: string): Promise<boolean> {
  // For development, we'll store plain text passwords in password_hash field
  // In production, use proper password verification
  return password === storedPasswordHash
}

export function generateToken(userId: number, role: string): string {
  // Simple token generation for development
  const payload = { userId, role, timestamp: Date.now() }
  return btoa(JSON.stringify(payload))
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const payload = JSON.parse(atob(token))
    // Check if token is not too old (24 hours)
    if (Date.now() - payload.timestamp > 24 * 60 * 60 * 1000) {
      return null
    }
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}

export async function getUserById(id: number) {
  const users = await sql`
    SELECT id, username, email, role, created_at, updated_at
    FROM users 
    WHERE id = ${id}
  `
  return users[0] || null
}
