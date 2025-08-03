import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL, {
  disableWarningInBrowsers: true,
})

// Type definitions for database entities
export interface User {
  id: number
  username: string
  email: string
  password: string
  role: "admin" | "cashier"
  created_at: string
  updated_at: string
  sales?: number
}

export interface Category {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  product_count?: number
}

export interface Product {
  id: number
  name: string
  image_url?: string
  cost_price: number
  selling_price: number
  barcode?: string
  stock: number
  sizes: string[]
  colors: string[]
  category_id?: number
  category?: { name: string }
  created_at: string
  updated_at: string
}

export interface Sale {
  id: number
  user_id: number
  total_amount: number
  payment_method: "cash" | "card" | "mobile"
  created_at: string
  items?: SaleItem[]
  user?: { username: string }
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  quantity: number
  unit_price: number
  created_at: string
  product?: Product
}

export interface Settings {
  id: number
  store_name: string
  logo_url?: string
  tax_rate: number
  currency: string
  timezone: string
  created_at: string
  updated_at: string
}
