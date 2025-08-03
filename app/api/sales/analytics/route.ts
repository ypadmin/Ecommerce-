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

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Get overall sales statistics
    let salesStatsQuery
    if (dateFrom && dateTo) {
      salesStatsQuery = sql`
        SELECT 
          COUNT(*)::integer as total_transactions,
          COALESCE(SUM(total_amount), 0)::numeric as total_sales,
          COALESCE(AVG(total_amount), 0)::numeric as average_sale,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::integer as today_sales
        FROM sales
        WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
      `
    } else if (dateFrom) {
      salesStatsQuery = sql`
        SELECT 
          COUNT(*)::integer as total_transactions,
          COALESCE(SUM(total_amount), 0)::numeric as total_sales,
          COALESCE(AVG(total_amount), 0)::numeric as average_sale,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::integer as today_sales
        FROM sales
        WHERE created_at >= ${dateFrom}
      `
    } else if (dateTo) {
      salesStatsQuery = sql`
        SELECT 
          COUNT(*)::integer as total_transactions,
          COALESCE(SUM(total_amount), 0)::numeric as total_sales,
          COALESCE(AVG(total_amount), 0)::numeric as average_sale,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::integer as today_sales
        FROM sales
        WHERE created_at <= ${dateTo + " 23:59:59"}
      `
    } else {
      salesStatsQuery = sql`
        SELECT 
          COUNT(*)::integer as total_transactions,
          COALESCE(SUM(total_amount), 0)::numeric as total_sales,
          COALESCE(AVG(total_amount), 0)::numeric as average_sale,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::integer as today_sales
        FROM sales
      `
    }

    const salesStats = await salesStatsQuery

    // Get sales by payment method with fallback
    let paymentMethods
    try {
      let paymentMethodQuery
      if (dateFrom && dateTo) {
        paymentMethodQuery = sql`
          SELECT 
            COALESCE(payment_method, 'cash') as method,
            COUNT(*)::integer as count,
            COALESCE(SUM(total_amount), 0)::numeric as total
          FROM sales
          WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
          GROUP BY COALESCE(payment_method, 'cash')
        `
      } else if (dateFrom) {
        paymentMethodQuery = sql`
          SELECT 
            COALESCE(payment_method, 'cash') as method,
            COUNT(*)::integer as count,
            COALESCE(SUM(total_amount), 0)::numeric as total
          FROM sales
          WHERE created_at >= ${dateFrom}
          GROUP BY COALESCE(payment_method, 'cash')
        `
      } else if (dateTo) {
        paymentMethodQuery = sql`
          SELECT 
            COALESCE(payment_method, 'cash') as method,
            COUNT(*)::integer as count,
            COALESCE(SUM(total_amount), 0)::numeric as total
          FROM sales
          WHERE created_at <= ${dateTo + " 23:59:59"}
          GROUP BY COALESCE(payment_method, 'cash')
        `
      } else {
        paymentMethodQuery = sql`
          SELECT 
            COALESCE(payment_method, 'cash') as method,
            COUNT(*)::integer as count,
            COALESCE(SUM(total_amount), 0)::numeric as total
          FROM sales
          GROUP BY COALESCE(payment_method, 'cash')
        `
      }
      paymentMethods = await paymentMethodQuery
    } catch (error) {
      paymentMethods = [
        { method: "cash", count: 0, total: 0 },
        { method: "card", count: 0, total: 0 },
      ]
    }

    // Get top selling products with correct column names
    let topProductsQuery
    if (dateFrom && dateTo) {
      topProductsQuery = sql`
        SELECT 
          p.id,
          p.name,
          p.image_url,
          p.cost_price,
          p.selling_price,
          p.stock,
          SUM(si.quantity)::integer as total_sold,
          COALESCE(SUM(COALESCE(si.unit_price, p.selling_price) * si.quantity), 0)::numeric as total_revenue,
          COALESCE(SUM(p.cost_price * si.quantity), 0)::numeric as total_cost,
          COALESCE(SUM((COALESCE(si.unit_price, p.selling_price) - p.cost_price) * si.quantity), 0)::numeric as total_profit,
          COUNT(DISTINCT s.id)::integer as transaction_count
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= ${dateFrom} AND s.created_at <= ${dateTo + " 23:59:59"}
        GROUP BY p.id, p.name, p.image_url, p.cost_price, p.selling_price, p.stock
        ORDER BY total_sold DESC
        LIMIT 10
      `
    } else if (dateFrom) {
      topProductsQuery = sql`
        SELECT 
          p.id,
          p.name,
          p.image_url,
          p.cost_price,
          p.selling_price,
          p.stock,
          SUM(si.quantity)::integer as total_sold,
          COALESCE(SUM(COALESCE(si.unit_price, p.selling_price) * si.quantity), 0)::numeric as total_revenue,
          COALESCE(SUM(p.cost_price * si.quantity), 0)::numeric as total_cost,
          COALESCE(SUM((COALESCE(si.unit_price, p.selling_price) - p.cost_price) * si.quantity), 0)::numeric as total_profit,
          COUNT(DISTINCT s.id)::integer as transaction_count
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= ${dateFrom}
        GROUP BY p.id, p.name, p.image_url, p.cost_price, p.selling_price, p.stock
        ORDER BY total_sold DESC
        LIMIT 10
      `
    } else if (dateTo) {
      topProductsQuery = sql`
        SELECT 
          p.id,
          p.name,
          p.image_url,
          p.cost_price,
          p.selling_price,
          p.stock,
          SUM(si.quantity)::integer as total_sold,
          COALESCE(SUM(COALESCE(si.unit_price, p.selling_price) * si.quantity), 0)::numeric as total_revenue,
          COALESCE(SUM(p.cost_price * si.quantity), 0)::numeric as total_cost,
          COALESCE(SUM((COALESCE(si.unit_price, p.selling_price) - p.cost_price) * si.quantity), 0)::numeric as total_profit,
          COUNT(DISTINCT s.id)::integer as transaction_count
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at <= ${dateTo + " 23:59:59"}
        GROUP BY p.id, p.name, p.image_url, p.cost_price, p.selling_price, p.stock
        ORDER BY total_sold DESC
        LIMIT 10
      `
    } else {
      topProductsQuery = sql`
        SELECT 
          p.id,
          p.name,
          p.image_url,
          p.cost_price,
          p.selling_price,
          p.stock,
          SUM(si.quantity)::integer as total_sold,
          COALESCE(SUM(COALESCE(si.unit_price, p.selling_price) * si.quantity), 0)::numeric as total_revenue,
          COALESCE(SUM(p.cost_price * si.quantity), 0)::numeric as total_cost,
          COALESCE(SUM((COALESCE(si.unit_price, p.selling_price) - p.cost_price) * si.quantity), 0)::numeric as total_profit,
          COUNT(DISTINCT s.id)::integer as transaction_count
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        GROUP BY p.id, p.name, p.image_url, p.cost_price, p.selling_price, p.stock
        ORDER BY total_sold DESC
        LIMIT 10
      `
    }

    const topProducts = await topProductsQuery

    // Get sales trend
    let salesTrendQuery
    if (dateFrom && dateTo) {
      salesTrendQuery = sql`
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*)::integer as transaction_count,
          COALESCE(SUM(total_amount), 0)::numeric as daily_total
        FROM sales
        WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC
        LIMIT 30
      `
    } else if (dateFrom) {
      salesTrendQuery = sql`
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*)::integer as transaction_count,
          COALESCE(SUM(total_amount), 0)::numeric as daily_total
        FROM sales
        WHERE created_at >= ${dateFrom}
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC
        LIMIT 30
      `
    } else if (dateTo) {
      salesTrendQuery = sql`
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*)::integer as transaction_count,
          COALESCE(SUM(total_amount), 0)::numeric as daily_total
        FROM sales
        WHERE created_at <= ${dateTo + " 23:59:59"}
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC
        LIMIT 30
      `
    } else {
      salesTrendQuery = sql`
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*)::integer as transaction_count,
          COALESCE(SUM(total_amount), 0)::numeric as daily_total
        FROM sales
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC
        LIMIT 30
      `
    }

    const salesTrend = await salesTrendQuery

    // Get low stock products
    const lowStockProducts = await sql`
      SELECT 
        p.id,
        p.name,
        p.stock,
        p.selling_price,
        p.image_url,
        COALESCE(SUM(si.quantity), 0)::integer as total_sold_all_time
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      WHERE p.stock <= 10
      GROUP BY p.id, p.name, p.stock, p.selling_price, p.image_url
      ORDER BY p.stock ASC
      LIMIT 10
    `

    // Get recent sales
    let recentSalesQuery
    if (dateFrom && dateTo) {
      recentSalesQuery = sql`
        SELECT 
          s.id,
          s.total_amount,
          s.tax_amount,
          s.created_at,
          u.username as cashier,
          COUNT(si.id)::integer as item_count,
          STRING_AGG(p.name, ', ') as product_names
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= ${dateFrom} AND s.created_at <= ${dateTo + " 23:59:59"}
        GROUP BY s.id, s.total_amount, s.tax_amount, s.created_at, u.username
        ORDER BY s.created_at DESC
        LIMIT 20
      `
    } else if (dateFrom) {
      recentSalesQuery = sql`
        SELECT 
          s.id,
          s.total_amount,
          s.tax_amount,
          s.created_at,
          u.username as cashier,
          COUNT(si.id)::integer as item_count,
          STRING_AGG(p.name, ', ') as product_names
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= ${dateFrom}
        GROUP BY s.id, s.total_amount, s.tax_amount, s.created_at, u.username
        ORDER BY s.created_at DESC
        LIMIT 20
      `
    } else if (dateTo) {
      recentSalesQuery = sql`
        SELECT 
          s.id,
          s.total_amount,
          s.tax_amount,
          s.created_at,
          u.username as cashier,
          COUNT(si.id)::integer as item_count,
          STRING_AGG(p.name, ', ') as product_names
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.created_at <= ${dateTo + " 23:59:59"}
        GROUP BY s.id, s.total_amount, s.tax_amount, s.created_at, u.username
        ORDER BY s.created_at DESC
        LIMIT 20
      `
    } else {
      recentSalesQuery = sql`
        SELECT 
          s.id,
          s.total_amount,
          s.tax_amount,
          s.created_at,
          u.username as cashier,
          COUNT(si.id)::integer as item_count,
          STRING_AGG(p.name, ', ') as product_names
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        GROUP BY s.id, s.total_amount, s.tax_amount, s.created_at, u.username
        ORDER BY s.created_at DESC
        LIMIT 20
      `
    }

    const recentSales = await recentSalesQuery

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          total_transactions: Number(salesStats[0]?.total_transactions) || 0,
          total_sales: Number(salesStats[0]?.total_sales) || 0,
          average_sale: Number(salesStats[0]?.average_sale) || 0,
          today_sales: Number(salesStats[0]?.today_sales) || 0,
        },
        payment_methods: Array.isArray(paymentMethods)
          ? paymentMethods.map((pm) => ({
              method: pm.method,
              count: Number(pm.count) || 0,
              total: Number(pm.total) || 0,
            }))
          : [
              { method: "cash", count: 0, total: 0 },
              { method: "card", count: 0, total: 0 },
            ],
        top_products: topProducts.map((product) => ({
          id: product.id,
          name: product.name,
          image_url: product.image_url,
          cost_price: Number(product.cost_price) || 0,
          selling_price: Number(product.selling_price) || 0,
          stock: Number(product.stock) || 0,
          total_sold: Number(product.total_sold) || 0,
          total_revenue: Number(product.total_revenue) || 0,
          total_cost: Number(product.total_cost) || 0,
          total_profit: Number(product.total_profit) || 0,
          transaction_count: Number(product.transaction_count) || 0,
          profit_margin:
            Number(product.total_revenue) > 0
              ? ((Number(product.total_profit) / Number(product.total_revenue)) * 100).toFixed(2)
              : "0.00",
        })),
        sales_trend: salesTrend.map((trend) => ({
          date: trend.sale_date,
          transaction_count: Number(trend.transaction_count) || 0,
          daily_total: Number(trend.daily_total) || 0,
        })),
        low_stock_products: lowStockProducts.map((product) => ({
          id: product.id,
          name: product.name,
          stock: Number(product.stock) || 0,
          selling_price: Number(product.selling_price) || 0,
          image_url: product.image_url,
          total_sold_all_time: Number(product.total_sold_all_time) || 0,
        })),
        recent_sales: recentSales.map((sale) => ({
          id: sale.id,
          total_amount: Number(sale.total_amount) || 0,
          tax_amount: Number(sale.tax_amount) || 0,
          created_at: sale.created_at,
          cashier: sale.cashier || "Unknown",
          item_count: Number(sale.item_count) || 0,
          product_names: sale.product_names || "",
        })),
      },
    })
  } catch (error) {
    console.error("Sales analytics error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sales analytics",
        analytics: {
          overview: {
            total_transactions: 0,
            total_sales: 0,
            average_sale: 0,
            today_sales: 0,
          },
          payment_methods: [
            { method: "cash", count: 0, total: 0 },
            { method: "card", count: 0, total: 0 },
          ],
          top_products: [],
          sales_trend: [],
          low_stock_products: [],
          recent_sales: [],
        },
      },
      { status: 500 },
    )
  }
}
