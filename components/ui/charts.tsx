"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts"

interface PaymentMethodData {
  method: string
  count: number
  amount: number
}

interface SalesData {
  date: string
  orders: number
  revenue: number
}

interface CategoryData {
  category: string
  itemsSold: number
  revenue: number
}

interface HourlyData {
  hour: number
  orders: number
  revenue: number
}

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

export function PaymentMethodChart({ data }: { data: PaymentMethodData[] }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("lo-LA", {
      style: "currency",
      currency: "LAK",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium capitalize">{data.method}</p>
          <p className="text-sm text-gray-600">{data.count} transactions</p>
          <p className="text-sm text-green-600 font-medium">{formatCurrency(data.amount)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="amount"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function SalesChart({ data }: { data: SalesData[] }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("lo-LA", {
      style: "currency",
      currency: "LAK",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip
          formatter={(value: number, name: string) => [
            name === "revenue" ? formatCurrency(value) : value,
            name === "revenue" ? "Revenue" : "Orders",
          ]}
        />
        <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("lo-LA", {
      style: "currency",
      currency: "LAK",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={formatCurrency} />
        <YAxis dataKey="category" type="category" width={100} />
        <Tooltip
          formatter={(value: number, name: string) => [
            name === "revenue" ? formatCurrency(value) : value,
            name === "revenue" ? "Revenue" : "Items Sold",
          ]}
        />
        <Bar dataKey="revenue" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function HourlyChart({ data }: { data: HourlyData[] }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("lo-LA", {
      style: "currency",
      currency: "LAK",
      minimumFractionDigits: 0,
    }).format(value)
  }

  // Fill in missing hours with 0 values
  const fullHourData = Array.from({ length: 24 }, (_, hour) => {
    const existingData = data.find((d) => d.hour === hour)
    return existingData || { hour, orders: 0, revenue: 0 }
  })

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={fullHourData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip
          formatter={(value: number, name: string) => [
            name === "revenue" ? formatCurrency(value) : value,
            name === "revenue" ? "Revenue" : "Orders",
          ]}
          labelFormatter={(hour) => `${hour}:00`}
        />
        <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
