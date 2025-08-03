"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Minus, ShoppingCart, Trash2, Package, CreditCard, Banknote } from "lucide-react"
import { Receipt } from "@/components/ui/receipt"
import type { Product } from "@/lib/db"

interface CartItem {
  product_id: number
  name: string
  unit_price: number
  quantity: number
  total_price: number
  size?: string
  color?: string
  stock: number
  image_url?: string
}

interface ProductWithVariant extends Product {
  selectedSize?: string
  selectedColor?: string
}

interface SaleData {
  sale_id: number
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  payment_method: string
  amount_received?: number
  change?: number
  cashier: string
  date: string
  store_name?: string
  store_address?: string
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [categories, setCategories] = useState<any[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<SaleData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [amountReceived, setAmountReceived] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [storeSettings, setStoreSettings] = useState<any>(null)

  useEffect(() => {
    // Get current user info
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }

    fetchProducts()
    fetchCategories()
    fetchStoreSettings()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Ensure all price fields are numbers
        const processedProducts = data.map((product: any) => ({
          ...product,
          cost_price: Number(product.cost_price) || 0,
          selling_price: Number(product.selling_price) || 0,
          stock: Number(product.stock) || 0,
        }))
        setProducts(processedProducts)
      } else {
        console.error("Failed to fetch products:", response.status)
        setError("Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to fetch products")
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

  const fetchStoreSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStoreSettings(data.settings)
        }
      }
    } catch (error) {
      console.error("Error fetching store settings:", error)
    }
  }

  // Safe number conversion helper
  const safeNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  const addToCart = (product: ProductWithVariant) => {
    // Safely convert selling_price to number
    const sellingPrice = safeNumber(product.selling_price)

    if (sellingPrice <= 0) {
      alert("Invalid product price")
      return
    }

    const existingItemIndex = cart.findIndex(
      (item) =>
        item.product_id === product.id && item.size === product.selectedSize && item.color === product.selectedColor,
    )

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      const existingItem = updatedCart[existingItemIndex]

      if (existingItem.quantity < product.stock) {
        existingItem.quantity += 1
        existingItem.total_price = Number((existingItem.quantity * existingItem.unit_price).toFixed(2))
        setCart(updatedCart)
      } else {
        alert("Insufficient stock")
      }
    } else {
      if (product.stock > 0) {
        const newItem: CartItem = {
          product_id: product.id,
          name: product.name,
          unit_price: Number(sellingPrice.toFixed(2)),
          quantity: 1,
          total_price: Number(sellingPrice.toFixed(2)),
          size: product.selectedSize,
          color: product.selectedColor,
          stock: product.stock,
          image_url: product.image_url,
        }
        setCart([...cart, newItem])
      } else {
        alert("Product out of stock")
      }
    }
  }

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }

    const updatedCart = [...cart]
    const item = updatedCart[index]

    if (newQuantity <= item.stock) {
      item.quantity = newQuantity
      item.total_price = Number((item.quantity * item.unit_price).toFixed(2))
      setCart(updatedCart)
    } else {
      alert("Insufficient stock")
    }
  }

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index)
    setCart(updatedCart)
  }

  const clearCart = () => {
    setCart([])
    setShowCheckout(false)
    setAmountReceived("")
    setError("")
  }

  const calculateSubtotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + safeNumber(item.total_price), 0)
    return Number(subtotal.toFixed(2))
  }

  const calculateTax = () => {
    const taxRate = storeSettings ? storeSettings.tax_rate / 100 : 0.1 // Use dynamic tax rate or default to 10%
    const tax = calculateSubtotal() * taxRate
    return Number(tax.toFixed(2))
  }

  const calculateTotal = () => {
    const total = calculateSubtotal() + calculateTax()
    return Number(total.toFixed(2))
  }

  const processSale = async () => {
    if (cart.length === 0) {
      setError("Cart is empty")
      return
    }

    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const total = calculateTotal()

    // Additional validation
    if (subtotal <= 0 || total <= 0) {
      setError("Invalid cart total. Please check your items.")
      return
    }

    const receivedAmount = safeNumber(amountReceived)
    if (paymentMethod === "cash") {
      if (receivedAmount < total) {
        setError("Insufficient payment amount")
        return
      }
    }

    setProcessing(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      // Prepare the request data with proper validation
      const requestData = {
        items: cart.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_price: Number(safeNumber(item.unit_price).toFixed(2)),
          total_price: Number(safeNumber(item.total_price).toFixed(2)),
          size: item.size || null,
          color: item.color || null,
          name: item.name, // Include name for better error messages
        })),
        total_amount: Number(total.toFixed(2)),
        tax_amount: Number(tax.toFixed(2)),
        payment_method: paymentMethod,
      }

      console.log("Sending sale request:", requestData)

      // Validate request data before sending
      if (!requestData.total_amount || requestData.total_amount <= 0) {
        setError("Invalid total amount calculated")
        setProcessing(false)
        return
      }

      if (!requestData.items || requestData.items.length === 0) {
        setError("No items to process")
        setProcessing(false)
        return
      }

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      // Get response text first to handle both JSON and non-JSON responses
      const responseText = await response.text()
      console.log("Sale response text:", responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse sale response:", parseError)
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}...`)
      }

      if (response.ok && result.success) {
        // Prepare receipt data
        const change = paymentMethod === "cash" ? receivedAmount - total : 0
        const saleData: SaleData = {
          sale_id: result.sale_id,
          items: cart,
          subtotal,
          tax,
          total,
          payment_method: paymentMethod,
          amount_received: paymentMethod === "cash" ? receivedAmount : undefined,
          change: paymentMethod === "cash" ? change : undefined,
          cashier: currentUser?.username || "Unknown",
          date: new Date().toISOString(),
          store_name: "Clothing Store",
          store_address: "123 Main Street, Vientiane, Laos",
        }

        setReceiptData(saleData)
        setShowReceipt(true)
        setShowCheckout(false)
        clearCart()
        fetchProducts() // Refresh products to update stock
      } else {
        const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`
        setError(errorMessage)
        console.error("Sale failed:", result)
      }
    } catch (error) {
      console.error("Error processing sale:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to process sale"
      setError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || product.category_id?.toString() === selectedCategory
    return matchesSearch && matchesCategory && product.stock > 0
  })

  const formatCurrency = (amount: number | string) => {
    const numAmount = safeNumber(amount)
    return new Intl.NumberFormat("lo-LA", {
      style: "currency",
      currency: "LAK",
      minimumFractionDigits: 0,
    }).format(numAmount)
  }

  const getChange = () => {
    const received = safeNumber(amountReceived)
    const total = calculateTotal()
    return Number((received - total).toFixed(2))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Products Section */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <div className="flex-1 flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <select
              className="input-field min-w-[150px]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} formatCurrency={formatCurrency} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No products available</p>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 bg-white rounded-lg border border-gray-200 p-4 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Cart ({cart.length})
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-red-600 hover:text-red-700 text-sm">
              Clear All
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
          {cart.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                {(item.size || item.color) && (
                  <p className="text-xs text-gray-500">
                    {item.size && `Size: ${item.size}`}
                    {item.size && item.color && " • "}
                    {item.color && `Color: ${item.color}`}
                  </p>
                )}
                <p className="text-sm text-green-600 font-medium">{formatCurrency(item.unit_price)}</p>
                <p className="text-xs text-gray-500">Total: {formatCurrency(item.total_price)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                  className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                  className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromCart(index)}
                  className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 ml-2"
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {cart.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Cart is empty</p>
          </div>
        )}

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({storeSettings ? storeSettings.tax_rate : 10}%):</span>
              <span>{formatCurrency(calculateTax())}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="w-full btn-primary mt-4"
              disabled={cart.length === 0 || calculateTotal() <= 0}
            >
              Checkout ({formatCurrency(calculateTotal())})
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Checkout</h2>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Items ({cart.length}):</span>
                      <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} pcs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Tax ({storeSettings ? storeSettings.tax_rate : 10}%):</span>
                      <span>{formatCurrency(calculateTax())}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t pt-1">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-3 rounded border-2 flex items-center justify-center gap-2 ${
                        paymentMethod === "cash"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3 rounded border-2 flex items-center justify-center gap-2 ${
                        paymentMethod === "card"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Card
                    </button>
                  </div>
                </div>

                {/* Cash Payment */}
                {paymentMethod === "cash" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                    <input
                      type="number"
                      className="input-field"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="Enter amount received"
                      min={calculateTotal()}
                      step="0.01"
                    />
                    {amountReceived && (
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between">
                          <span>Change:</span>
                          <span className={getChange() >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(Math.max(0, getChange()))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCheckout(false)
                      setError("")
                    }}
                    className="flex-1 btn-secondary"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processSale}
                    className="flex-1 btn-primary"
                    disabled={processing || (paymentMethod === "cash" && getChange() < 0) || calculateTotal() <= 0}
                  >
                    {processing ? "Processing..." : `Complete Sale (${formatCurrency(calculateTotal())})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <Receipt
          saleData={{
            id: receiptData.sale_id,
            items: receiptData.items.map((item) => ({
              id: item.product_id,
              name: item.name,
              quantity: item.quantity,
              price: item.unit_price,
            })),
            subtotal: receiptData.subtotal,
            tax: receiptData.tax,
            total: receiptData.total,
            payment_method: receiptData.payment_method,
            amount_paid: receiptData.amount_received || receiptData.total,
            change_given: receiptData.change || 0,
            created_at: receiptData.date,
          }}
          settings={storeSettings}
          onClose={() => setShowReceipt(false)}
          onPrint={() => console.log("Receipt printed")}
        />
      )}
    </div>
  )
}

// Product Card Component
function ProductCard({
  product,
  onAddToCart,
  formatCurrency,
}: {
  product: Product
  onAddToCart: (product: ProductWithVariant) => void
  formatCurrency: (amount: number | string) => string
}) {
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [showVariants, setShowVariants] = useState(false)

  // Safe number conversion for product prices
  const safeNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  const sellingPrice = safeNumber(product.selling_price)

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setShowVariants(true)
      return
    }
    if (product.colors.length > 0 && !selectedColor) {
      setShowVariants(true)
      return
    }

    onAddToCart({
      ...product,
      selectedSize,
      selectedColor,
    })

    // Reset selections
    setSelectedSize("")
    setSelectedColor("")
    setShowVariants(false)
  }

  return (
    <div className="card p-3">
      <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <Package className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
        <p className="text-sm font-bold text-green-600">{formatCurrency(sellingPrice)}</p>

        {/* Variant Selection */}
        {showVariants && (
          <div className="space-y-2 pt-2 border-t">
            {product.sizes.length > 0 && (
              <div>
                <label className="text-xs text-gray-600">Size:</label>
                <select
                  className="w-full text-xs border rounded px-1 py-1"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="">Select Size</option>
                  {product.sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {product.colors.length > 0 && (
              <div>
                <label className="text-xs text-gray-600">Color:</label>
                <select
                  className="w-full text-xs border rounded px-1 py-1"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                >
                  <option value="">Select Color</option>
                  {product.colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleAddToCart}
          className="w-full btn-primary text-xs py-2 mt-2"
          disabled={product.stock === 0 || sellingPrice <= 0}
        >
          {product.stock === 0 ? "Out of Stock" : sellingPrice <= 0 ? "Invalid Price" : "Add to Cart"}
        </button>
      </div>
    </div>
  )
}
