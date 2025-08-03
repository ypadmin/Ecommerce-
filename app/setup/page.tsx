"use client"

import { useState } from "react"
import Link from "next/link"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const runSetup = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Setup failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const runDebug = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/debug")
      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Debug failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
          <p className="mt-2 text-gray-600">Initialize your POS system database</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Setup Actions</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={runSetup}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 mr-4"
              >
                {loading ? "Running..." : "Run Database Setup"}
              </button>
              <button
                onClick={runDebug}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Running..." : "Debug Database"}
              </button>
            </div>
            <p className="text-sm text-gray-600">This will create all necessary tables and insert sample data.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-green-800 mb-2">{result.status || "Setup Result"}</h3>
            <pre className="text-sm text-green-700 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="space-y-2">
            <p className="text-gray-600">After successful setup:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>
                Login with admin credentials: <strong>admin@store.com</strong> / <strong>admin123</strong>
              </li>
              <li>Change the default admin password</li>
              <li>Configure your store settings</li>
              <li>Add your products and categories</li>
            </ul>
            <div className="mt-4">
              <Link
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
