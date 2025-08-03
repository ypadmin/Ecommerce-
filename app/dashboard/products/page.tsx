"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Package, AlertCircle } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import type { Product, Category } from "@/lib/db"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
    cost_price: "",
    selling_price: "",
    barcode: "",
    stock: "",
    sizes: "",
    colors: "",
    category_id: "",
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setError("")
      const token = localStorage.getItem("token")
      const response = await fetch("/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch products" }))
        setError(errorData.error || "Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"

      // Validate form data
      if (!formData.name.trim()) {
        setError("Product name is required")
        setSaving(false)
        return
      }

      if (!formData.cost_price || !formData.selling_price || !formData.stock) {
        setError("Cost price, selling price, and stock are required")
        setSaving(false)
        return
      }

      const costPrice = Number.parseFloat(formData.cost_price)
      const sellingPrice = Number.parseFloat(formData.selling_price)
      const stock = Number.parseInt(formData.stock)

      if (isNaN(costPrice) || isNaN(sellingPrice) || isNaN(stock)) {
        setError("Please enter valid numbers for prices and stock")
        setSaving(false)
        return
      }

      if (costPrice < 0 || sellingPrice < 0 || stock < 0) {
        setError("Prices and stock cannot be negative")
        setSaving(false)
        return
      }

      const requestBody = {
        name: formData.name.trim(),
        image_url: formData.image_url,
        cost_price: costPrice,
        selling_price: sellingPrice,
        barcode: formData.barcode.trim() || null,
        stock: stock,
        sizes: formData.sizes
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        colors: formData.colors
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c),
        category_id: formData.category_id ? Number.parseInt(formData.category_id) : null,
      }

      console.log("Sending request:", { method, url, body: requestBody })

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      let responseData
      try {
        const responseText = await response.text()
        console.log("Response text:", responseText)
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        setError("Server returned invalid response")
        setSaving(false)
        return
      }

      if (response.ok && responseData.success) {
        await fetchProducts()
        setShowModal(false)
        resetForm()
      } else {
        setError(responseData.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error("Error saving product:", error)
      setError("Network error occurred. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      image_url: product.image_url || "",
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      barcode: product.barcode || "",
      stock: product.stock.toString(),
      sizes: product.sizes.join(", "),
      colors: product.colors.join(", "),
      category_id: product.category_id?.toString() || "",
    })
    setError("")
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      setError("")
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchProducts()
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete product" }))
        setError(errorData.error || "Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      setError("Network error occurred")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      image_url: "",
      cost_price: "",
      selling_price: "",
      barcode: "",
      stock: "",
      sizes: "",
      colors: "",
      category_id: "",
    })
    setEditingProduct(null)
    setError("")
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("lo-LA", {
      style: "currency",
      currency: "LAK",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button onClick={fetchProducts} className="text-red-600 hover:text-red-700 text-sm underline mt-2">
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
          placeholder="Search products..."
          className="input-field pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card">
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="w-12 h-12 text-gray-400" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Cost: {formatCurrency(product.cost_price)}</p>
                  <p className="text-sm font-medium text-green-600">Price: {formatCurrency(product.selling_price)}</p>
                </div>
              </div>

              {product.sizes.length > 0 && <p className="text-xs text-gray-500">Sizes: {product.sizes.join(", ")}</p>}

              {product.colors.length > 0 && (
                <p className="text-xs text-gray-500">Colors: {product.colors.join(", ")}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => handleEdit(product)} className="flex-1 btn-secondary text-xs py-1">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button onClick={() => handleDelete(product.id)} className="flex-1 btn-danger text-xs py-1">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !error && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No products found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editingProduct ? "Edit Product" : "Add Product"}</h2>

              {/* Error in Modal */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(value) => setFormData({ ...formData, image_url: value })}
                    className="mb-4"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Upload a product image. Supported formats: PNG, JPG, GIF (max 5MB)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (LAK) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="input-field"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (LAK) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="input-field"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Enter barcode"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="input-field"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="input-field"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="S, M, L, XL"
                      value={formData.sizes}
                      onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple sizes with commas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Red, Blue, Green"
                      value={formData.colors}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple colors with commas</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 btn-secondary"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingProduct ? "Updating..." : "Creating..."}
                      </>
                    ) : editingProduct ? (
                      "Update Product"
                    ) : (
                      "Create Product"
                    )}
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
