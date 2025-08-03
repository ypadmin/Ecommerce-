"use client"

import { useEffect, useState } from "react"
import { Package, Users, ShoppingCart, TrendingUp, CreditCard, Clock, BarChart3, Activity } from "lucide-react"
import { PaymentMethodChart, SalesChart, CategoryChart, HourlyChart } from "@/components/ui/charts"

interface DashboardStats {
  totalProducts: number
  totalUsers: number
  todaySales: number
  totalRevenue: number
}

interface AnalyticsData {
  paymentMethods: Array<{ method: string; count: number; amount: number }>
  trendingProducts: Array<{ name: string; image: string; sold: number; revenue: number; price: number }>
  dailySales: Array<{ date: string; orders: number; revenue: number }>
  hourlySales: Array<{ hour: number; orders: number; revenue: number }>
  categoryPerformance: Array<{ category: string; itemsSold: number; revenue: number }>
  recentOrders: Array<{ id: number; amount: number; method: string; date: string; cashier: string }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    todaySales: 0,
    totalRevenue: 0,
  })
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    paymentMethods: [],
    trendingProducts: [],
    dailySales: [],
    hourlySales: [],
    categoryPerformance: [],
    recentOrders: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError("")
      const token = localStorage.getItem("token")

      // Fetch basic stats
      const statsResponse = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Fetch analytics data
      const analyticsResponse = await fetch("/api/dashboard/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (statsResponse.ok && analyticsResponse.ok) {
        const statsData = await statsResponse.json()
        const analyticsData = await analyticsResponse.json()

        if (statsData.success) {
          setStats({
            totalProducts: statsData.totalProducts || 0,
            totalUsers: statsData.totalUsers || 0,
            todaySales: statsData.todaySales || 0,
            totalRevenue: statsData.totalRevenue || 0,
          })
        }

        if (analyticsData.success) {
          setAnalytics(analyticsData)
        }
      } else {
        setError("Failed to fetch dashboard data")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("lo-LA", {
      style: "currency",
      currency: "LAK",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Today Sales",
      value: stats.todaySales,
      icon: ShoppingCart,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to your POS system dashboard</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <div className="flex items-center text-sm text-gray-500">
            <Activity className="w-4 h-4 mr-1 text-green-500" />
            Live Data
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="text-red-600 hover:text-red-700 underline mt-2">
            Try Again
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {typeof stat.value === "number" && stat.title !== "Total Revenue"
                    ? stat.value.toLocaleString()
                    : stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
          </div>
          {analytics.paymentMethods.length > 0 ? (
            <PaymentMethodChart data={analytics.paymentMethods} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No payment data available</div>
          )}
        </div>

        {/* Daily Sales Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend (30 Days)</h3>
          </div>
          {analytics.dailySales.length > 0 ? (
            <SalesChart data={analytics.dailySales.map((ds) => ({ ...ds, date: formatDate(ds.date) }))} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No sales data available</div>
          )}
        </div>
      </div>

      {/* Category Performance & Hourly Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          {analytics.categoryPerformance.length > 0 ? (
            <CategoryChart data={analytics.categoryPerformance} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No category data available</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Today's Hourly Sales</h3>
          </div>
          {analytics.hourlySales.length > 0 ? (
            <HourlyChart data={analytics.hourlySales} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">No hourly data available</div>
          )}
        </div>
      </div>

      {/* Trending Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Products</h3>
          <div className="space-y-3">
            {analytics.trendingProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {product.image ? (
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    {product.sold} sold • {formatCurrency(product.revenue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">#{index + 1}</p>
                </div>
              </div>
            ))}
            {analytics.trendingProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">No trending products data available</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {analytics.recentOrders.slice(0, 5).map((order, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Order #{order.id}</p>
                  <p className="text-xs text-gray-500">
                    {order.cashier} • {order.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{formatCurrency(order.amount)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {analytics.recentOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">No recent orders available</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/dashboard/products"
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
          >
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900 group-hover:text-blue-600">Manage Products</p>
              <p className="text-sm text-gray-500">Add or edit products</p>
            </div>
          </a>
          <a
            href="/dashboard/pos"
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
          >
            <ShoppingCart className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900 group-hover:text-green-600">Point of Sale</p>
              <p className="text-sm text-gray-500">Process new sale</p>
            </div>
          </a>
          <a
            href="/dashboard/sales"
            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900 group-hover:text-purple-600">View Reports</p>
              <p className="text-sm text-gray-500">Detailed analytics</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
