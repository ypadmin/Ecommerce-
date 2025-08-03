"use client"

import { useState } from "react"
import { X, Printer } from "lucide-react"

interface ReceiptProps {
  saleData: {
    id: number
    items: Array<{
      id: number
      name: string
      quantity: number
      price: number
    }>
    subtotal: number
    tax: number
    total: number
    payment_method: string
    amount_paid: number
    change_given: number
    created_at: string
  }
  settings?: {
    store_name: string
    logo_url?: string
    address: string
    tax_rate: number
    currency: string
  }
  onClose: () => void
  onPrint: () => void
}

export function Receipt({ saleData, settings, onClose, onPrint }: ReceiptProps) {
  const [printing, setPrinting] = useState(false)

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || "LAK"
    return `${amount.toLocaleString()} ${currency}`
  }

  const handlePrint = async () => {
    setPrinting(true)
    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank", "width=300,height=600")
      if (!printWindow) {
        alert("Please allow popups to print receipts")
        return
      }

      // Generate receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt #${saleData.id}</title>
          <style>
            @media print {
              @page { 
                size: 80mm auto; 
                margin: 0; 
              }
              body { 
                margin: 0; 
                padding: 5mm;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              max-width: 80mm;
              margin: 0 auto;
              padding: 5mm;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            .logo { max-width: 60px; height: auto; margin: 0 auto 10px; }
            .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center">
            ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="Logo" class="logo" />` : ""}
            <div class="bold" style="font-size: 14px;">${settings?.store_name || "Store Name"}</div>
            <div style="font-size: 10px; margin: 5px 0;">${settings?.address || "Store Address"}</div>
            <div class="line"></div>
          </div>
          
          <div class="center">
            <div class="bold">RECEIPT #${saleData.id}</div>
            <div style="font-size: 10px;">${new Date(saleData.created_at).toLocaleString()}</div>
            <div class="line"></div>
          </div>
          
          <div>
            ${saleData.items
              .map(
                (item) => `
              <div class="item-row">
                <span>${item.name}</span>
              </div>
              <div class="item-row" style="font-size: 10px;">
                <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                <span>${formatCurrency(item.quantity * item.price)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="line"></div>
          
          <div class="item-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(saleData.subtotal)}</span>
          </div>
          <div class="item-row">
            <span>Tax (${settings?.tax_rate || 0}%):</span>
            <span>${formatCurrency(saleData.tax)}</span>
          </div>
          <div class="total-row">
            <span>TOTAL:</span>
            <span>${formatCurrency(saleData.total)}</span>
          </div>
          
          <div class="line"></div>
          
          <div class="item-row">
            <span>Payment:</span>
            <span>${saleData.payment_method.toUpperCase()}</span>
          </div>
          <div class="item-row">
            <span>Amount Paid:</span>
            <span>${formatCurrency(saleData.amount_paid)}</span>
          </div>
          ${
            saleData.change_given > 0
              ? `
          <div class="item-row">
            <span>Change:</span>
            <span>${formatCurrency(saleData.change_given)}</span>
          </div>
          `
              : ""
          }
          
          <div class="line"></div>
          <div class="center" style="font-size: 10px; margin-top: 10px;">
            <div>Thank you for your purchase!</div>
            <div>Please come again</div>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(receiptHTML)
      printWindow.document.close()

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }

      onPrint()
    } catch (error) {
      console.error("Print error:", error)
      alert("Failed to print receipt")
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Receipt #{saleData.id}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 font-mono text-sm">
          {/* Store Header */}
          <div className="text-center mb-6">
            {settings?.logo_url && (
              <img
                src={settings.logo_url || "/placeholder.svg"}
                alt="Store Logo"
                className="w-16 h-16 mx-auto mb-3 object-contain"
              />
            )}
            <h3 className="font-bold text-lg">{settings?.store_name || "Store Name"}</h3>
            <p className="text-xs text-gray-600 mt-1">{settings?.address || "Store Address"}</p>
            <div className="border-t border-dashed border-gray-300 my-3"></div>
          </div>

          {/* Transaction Info */}
          <div className="text-center mb-4">
            <p className="font-bold">RECEIPT #{saleData.id}</p>
            <p className="text-xs text-gray-600">{new Date(saleData.created_at).toLocaleString()}</p>
            <div className="border-t border-dashed border-gray-300 my-3"></div>
          </div>

          {/* Items */}
          <div className="mb-4">
            {saleData.items.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between">
                  <span className="flex-1">{item.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>
                    {item.quantity} x {formatCurrency(item.price)}
                  </span>
                  <span>{formatCurrency(item.quantity * item.price)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3"></div>

          {/* Totals */}
          <div className="space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(saleData.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({settings?.tax_rate || 0}%):</span>
              <span>{formatCurrency(saleData.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL:</span>
              <span>{formatCurrency(saleData.total)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3"></div>

          {/* Payment Info */}
          <div className="space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Payment:</span>
              <span>{saleData.payment_method.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span>{formatCurrency(saleData.amount_paid)}</span>
            </div>
            {saleData.change_given > 0 && (
              <div className="flex justify-between">
                <span>Change:</span>
                <span>{formatCurrency(saleData.change_given)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3"></div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600">
            <p>Thank you for your purchase!</p>
            <p>Please come again</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {printing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Printing...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Print Receipt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
