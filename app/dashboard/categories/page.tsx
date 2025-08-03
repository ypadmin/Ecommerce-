"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Tags, Package, AlertCircle } from "lucide-react"

interface Category {
  id: number
  name: string
  description?: string
  product_count: number
  created_at: string
  updated_at?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    console.log("Categories page - User data:", userData)

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log("Categories page - Parsed user:", parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
        setError("Invalid user data")
      }
    }
    setAuthLoading(false)

    if (userData) {
      fetchCategories()
    }
  }, [])

  const fetchCategories = async () => {
    try {
      setError("")
      const token = localStorage.getItem("token")
      console.log("Fetching categories with token:", !!token)

      if (!token) {
        setError("No authentication token found")
        setLoading(false)
        return
      }

      const response = await fetch("/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Categories response status:", response.status)
      console.log("Categories response headers:", response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Categories fetch error response:", errorText)

        try {
          const errorJson = JSON.parse(errorText)
          setError(errorJson.error || `HTTP ${response.status}: ${response.statusText}`)
        } catch {
          setError(`HTTP ${response.status}: ${errorText}`)
        }
        return
      }

      const data = await response.json()
      console.log("Categories data:", data)
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setError(error instanceof Error ? error.message : "Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const token = localStorage.getItem("token")
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories"
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchCategories()
        setShowModal(false)
        resetForm()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to save category")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      setError("Network error occurred")
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      setError("")
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      setError("Network error occurred")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    })
    setEditingCategory(null)
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Tags className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Access denied. Admin role required.</p>
          <p className="text-sm text-gray-400 mt-2">Current role: {user?.role || "Unknown"}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button onClick={fetchCategories} className="text-red-600 hover:text-red-700 text-sm underline mt-2">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search categories..."
          className="input-field pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Tags className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <Package className="w-3 h-3 mr-1" />
                    {category.product_count} products
                  </p>
                </div>
              </div>
            </div>

            {category.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="flex-1 btn-danger text-sm py-2 flex items-center justify-center gap-1"
                disabled={category.product_count > 0}
                title={category.product_count > 0 ? "Cannot delete category with products" : "Delete category"}
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Created: {new Date(category.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && !error && (
        <div className="text-center py-12">
          <Tags className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? "No categories found matching your search" : "No categories created yet"}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingCategory ? "Edit Category" : "Add Category"}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter category description (optional)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingCategory ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
