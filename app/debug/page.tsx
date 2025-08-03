"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Database, Users, AlertCircle, CheckCircle } from "lucide-react"

export default function DebugPage() {
  const [connectionTest, setConnectionTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/test/connection")
      const data = await response.json()
      setConnectionTest(data)

      if (!data.success) {
        setError(data.error || "Connection test failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      console.log("Login test result:", data)
      alert(`Login test: ${data.success ? "SUCCESS" : "FAILED"}\n${JSON.stringify(data, null, 2)}`)
    } catch (err) {
      console.error("Login test error:", err)
      alert(`Login test error: ${err}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Debug Dashboard</h1>
            <button onClick={testConnection} disabled={loading} className="btn-primary flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {connectionTest && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="card">
                <div className="flex items-center mb-4">
                  <Database className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold">Database Connection</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    {connectionTest.database_connected ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <span>Database Connected</span>
                  </div>

                  <div className="flex items-center">
                    {connectionTest.users_table_exists ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <span>Users Table Exists</span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <p>User Count: {connectionTest.user_count}</p>
                  <p>Timestamp: {connectionTest.timestamp}</p>
                </div>
              </div>

              {/* Users List */}
              {connectionTest.sample_users && connectionTest.sample_users.length > 0 && (
                <div className="card">
                  <div className="flex items-center mb-4">
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <h2 className="text-lg font-semibold">Sample Users</h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {connectionTest.sample_users.map((user: any) => (
                          <tr key={user.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{user.id}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{user.username}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{user.email}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <button
                                onClick={() =>
                                  testLogin(user.username, user.username === "admin" ? "admin123" : "cashier123")
                                }
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                Test Login
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Raw Response</h2>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(connectionTest, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Testing connection...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
