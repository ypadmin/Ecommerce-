"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Save, Upload, Store, MapPin, Percent, DollarSign, ImageIcon, AlertCircle, CheckCircle } from "lucide-react"

interface Settings {
  id?: number
  store_name: string
  logo_url?: string
  address: string
  tax_rate: number
  currency: string
  created_at?: string
  updated_at?: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    store_name: "",
    logo_url: "",
    address: "",
    tax_rate: 0,
    currency: "LAK",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [logoPreview, setLogoPreview] = useState<string>("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
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
          setSettings(data.settings)
          if (data.settings.logo_url) {
            setLogoPreview(data.settings.logo_url)
          }
        } else {
          setError(data.error || "Failed to fetch settings")
        }
      } else {
        setError(`HTTP ${response.status}: Failed to fetch settings`)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 100KB)
    if (file.size > 100 * 1024) {
      setError("Logo file is too large. Please use an image smaller than 100KB.")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setLogoPreview(result)
      setSettings((prev) => ({ ...prev, logo_url: result }))
      setError("")
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess("Settings updated successfully!")
        setSettings(data.settings)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      setError("Network error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Store Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Configure your store information and preferences</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Success</h3>
            <p className="text-green-700 text-sm mt-1">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <Store className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Store Information</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
              <input
                type="text"
                required
                maxLength={255}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={settings.store_name}
                onChange={(e) => setSettings((prev) => ({ ...prev, store_name: e.target.value }))}
                placeholder="Enter your store name"
              />
              <p className="text-xs text-gray-500 mt-1">{settings.store_name.length}/255 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Store logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Max 100KB, JPG/PNG</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Store Address *
            </label>
            <textarea
              required
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              value={settings.address}
              onChange={(e) => setSettings((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your complete store address"
            />
            <p className="text-xs text-gray-500 mt-1">{settings.address.length}/1000 characters</p>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Financial Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={settings.tax_rate}
                onChange={(e) => setSettings((prev) => ({ ...prev, tax_rate: Number(e.target.value) }))}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">Enter tax rate as percentage (0-100)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={settings.currency}
                onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
              >
                <option value="LAK">LAK - Lao Kip</option>
                <option value="USD">USD - US Dollar</option>
                <option value="THB">THB - Thai Baht</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Information */}
        {settings.id && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Settings ID:</span>
                <span className="ml-2 text-gray-600">{settings.id}</span>
              </div>
              {settings.created_at && (
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-600">{new Date(settings.created_at).toLocaleDateString()}</span>
                </div>
              )}
              {settings.updated_at && (
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <span className="ml-2 text-gray-600">{new Date(settings.updated_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
