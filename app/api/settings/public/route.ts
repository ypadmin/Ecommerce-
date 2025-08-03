import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const settings = await sql`
      SELECT store_name, logo_url 
      FROM settings 
      ORDER BY id DESC 
      LIMIT 1
    `

    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        settings: {
          store_name: "POS System",
          logo_url: null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      settings: {
        store_name: settings[0].store_name || "POS System",
        logo_url: settings[0].logo_url || null,
      },
    })
  } catch (error) {
    console.error("Public settings error:", error)
    return NextResponse.json({
      success: true,
      settings: {
        store_name: "POS System",
        logo_url: null,
      },
    })
  }
}
