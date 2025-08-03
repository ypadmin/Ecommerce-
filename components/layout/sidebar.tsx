"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Home, Package, Tags, Settings, LogOut, Store, Users, BarChart3, UserIcon } from "lucide-react"

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", roles: ["admin", "cashier"] },
    { href: "/dashboard/pos", icon: Store, label: "Point of Sale", roles: ["admin", "cashier"] },
    { href: "/dashboard/products", icon: Package, label: "Products", roles: ["admin", "cashier"] },
    { href: "/dashboard/categories", icon: Tags, label: "Categories", roles: ["admin"] },
    { href: "/dashboard/sales", icon: BarChart3, label: "Sales", roles: ["admin", "cashier"] },
    { href: "/dashboard/users", icon: Users, label: "Users", roles: ["admin"] },
    { href: "/dashboard/profile", icon: UserIcon, label: "Profile", roles: ["admin", "cashier"] },
    { href: "/dashboard/settings", icon: Settings, label: "Settings", roles: ["admin"] },
  ]

  const filteredMenuItems = menuItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-green-600 text-white rounded-md"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 bg-green-600">
            <Store className="w-8 h-8 text-white mr-2" />
            <h1 className="text-lg font-bold text-white">POS System</h1>
          </div>

          {/* User info */}
          {user && (
            <div className="p-4 border-b border-gray-200">
              <Link href="/dashboard/profile" onClick={() => setIsOpen(false)}>
                <div className="flex items-center hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-medium text-sm">{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
