import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/simple-auth"

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

    // Check if payment_method column exists, if not use default values
    let paymentMethods
    try {
      paymentMethods = await sql`
        SELECT 
          COALESCE(payment_method, 'cash') as payment_method,
          COUNT(*) as count,
          SUM(total_amount) as total_amount
        FROM sales 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY COALESCE(payment_method, 'cash')
        ORDER BY total_amount DESC
      `
    } catch (error) {
      // If payment_method column doesn't exist, create mock data
      paymentMethods = await sql`
        SELECT 
          'cash' as payment_method,
          COUNT(*) as count,
          SUM(total_amount) as total_amount
        FROM sales 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `
    }

    // Get trending products (top 10 by quantity sold)
    let trendingProducts
    try {
      // First try with unit_price column
      trendingProducts = await sql`
        SELECT 
          p.name,
          p.image_url,
          SUM(si.quantity) as total_sold,
          SUM(si.quantity * COALESCE(si.unit_price, p.selling_price)) as total_revenue,
          p.selling_price
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.id, p.name, p.image_url, p.selling_price
        ORDER BY total_sold DESC
        LIMIT 10
      `
    } catch (error) {
      // Fallback query if unit_price column doesn't exist
      try {
        trendingProducts = await sql`
          SELECT 
            p.name,
            p.image_url,
            SUM(si.quantity) as total_sold,
            SUM(si.quantity * p.selling_price) as total_revenue,
            p.selling_price
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          JOIN sales s ON si.sale_id = s.id
          WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY p.id, p.name, p.image_url, p.selling_price
          ORDER BY total_sold DESC
          LIMIT 10
        `
      } catch (fallbackError) {
        // If sale_items table has issues, return empty array
        trendingProducts = []
      }
    }

    // Get daily sales for the last 30 days
    const dailySales = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM sales
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Get hourly sales pattern for today
    const hourlySales = await sql`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM sales
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour ASC
    `

    // Get category performance
    let categoryPerformance
    try {
      categoryPerformance = await sql`
        SELECT 
          c.name as category,
          COUNT(si.id) as items_sold,
          SUM(si.quantity * COALESCE(si.unit_price, p.selling_price)) as revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `
    } catch (error) {
      // Fallback query
      try {
        categoryPerformance = await sql`
          SELECT 
            c.name as category,
            COUNT(si.id) as items_sold,
            SUM(si.quantity * p.selling_price) as revenue
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          JOIN sales s ON si.sale_id = s.id
          WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY c.id, c.name
          ORDER BY revenue DESC
        `
      } catch (fallbackError) {
        categoryPerformance = []
      }
    }

    // Get recent orders
    const recentOrders = await sql`
      SELECT 
        s.id,
        s.total_amount,
        COALESCE(s.payment_method, 'cash') as payment_method,
        s.created_at,
        u.username as cashier
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      paymentMethods: paymentMethods.map((pm) => ({
        method: pm.payment_method || "cash",
        count: Number(pm.count),
        amount: Number(pm.total_amount || 0),
      })),
      trendingProducts: trendingProducts.map((tp) => ({
        name: tp.name,
        image: tp.image_url,
        sold: Number(tp.total_sold || 0),
        revenue: Number(tp.total_revenue || 0),
        price: Number(tp.selling_price || 0),
      })),
      dailySales: dailySales.map((ds) => ({
        date: ds.date,
        orders: Number(ds.orders || 0),
        revenue: Number(ds.revenue || 0),
      })),
      hourlySales: hourlySales.map((hs) => ({
        hour: Number(hs.hour || 0),
        orders: Number(hs.orders || 0),
        revenue: Number(hs.revenue || 0),
      })),
      categoryPerformance: categoryPerformance.map((cp) => ({
        category: cp.category,
        itemsSold: Number(cp.items_sold || 0),
        revenue: Number(cp.revenue || 0),
      })),
      recentOrders: recentOrders.map((ro) => ({
        id: ro.id,
        amount: Number(ro.total_amount || 0),
        method: ro.payment_method || "cash",
        date: ro.created_at,
        cashier: ro.cashier || "Unknown",
      })),
    })
  } catch (error) {
    console.error("Dashboard analytics error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
