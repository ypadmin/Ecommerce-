import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "POS System - Point of Sale",
  description: "Modern point of sale system for retail businesses",
  keywords: "POS, point of sale, retail, inventory, sales, LAK, Laos",
  authors: [{ name: "POS System Team" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased">
        <div id="root">{children}</div>
        <div id="modal-root"></div>
        <div id="toast-root"></div>
      </body>
    </html>
  )
}
