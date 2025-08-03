import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/simple-auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const updatedCategories = await sql`
      UPDATE categories 
      SET 
        name = ${name},
        description = ${description || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `

    if (updatedCategories.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(updatedCategories[0])
  } catch (error) {
    console.error("Category update error:", error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }

    return NextResponse.json(
      {
        error: "Failed to update category",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
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
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Check if category has products
    const productsInCategory = await sql`
      SELECT COUNT(*) as count FROM products WHERE category_id = ${params.id}
    `

    if (Number.parseInt(productsInCategory[0].count) > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with existing products",
        },
        { status: 400 },
      )
    }

    const deletedCategories = await sql`
      DELETE FROM categories 
      WHERE id = ${params.id}
      RETURNING id
    `

    if (deletedCategories.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Category deletion error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete category",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
