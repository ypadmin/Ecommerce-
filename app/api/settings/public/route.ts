import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // First, try to check if the settings table exists and get its structure
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      );
    `

    if (!tableExists[0]?.exists) {
      // Table doesn't exist, return default settings
      return NextResponse.json({
        store_name: "POS System",
        logo_url: "",
        store_address: "",
        store_phone: "",
      })
    }

    // Check if the table has the expected columns
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'settings' 
      AND table_schema = 'public'
    `

    const columnNames = columns.map((col: any) => col.column_name)

    if (!columnNames.includes("key") || !columnNames.includes("value")) {
      // Table exists but doesn't have expected structure, return defaults
      return NextResponse.json({
        store_name: "POS System",
        logo_url: "",
        store_address: "",
        store_phone: "",
      })
    }

    // Table exists with correct structure, fetch settings
    const settings = await sql`
      SELECT key, value 
      FROM settings 
      WHERE key IN ('store_name', 'logo_url', 'store_address', 'store_phone')
    `

    const settingsObj = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value || ""
      return acc
    }, {})

    // Provide defaults for any missing settings
    const response = {
      store_name: settingsObj.store_name || "POS System",
      logo_url: settingsObj.logo_url || "",
      store_address: settingsObj.store_address || "",
      store_phone: settingsObj.store_phone || "",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching public settings:", error)

    // Return default settings if any error occurs
    return NextResponse.json({
      store_name: "POS System",
      logo_url: "",
      store_address: "",
      store_phone: "",
    })
  }
}
