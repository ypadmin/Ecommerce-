"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, AlertCircle } from "lucide-react"

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({ value, onChange, disabled, className }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedDataUrl)
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    if (!file) return

    setError("")
    setUploading(true)

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file")
      }

      // Validate file size (max 10MB for original file)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Original image size must be less than 10MB")
      }

      // Compress the image
      const compressedDataUrl = await compressImage(file, 800, 0.8)

      // Check compressed size (base64 is ~33% larger than binary)
      const compressedSize = compressedDataUrl.length
      console.log("Compressed image size:", compressedSize, "characters")

      if (compressedSize > 5 * 1024 * 1024) {
        // 5MB limit for base64
        // Try with lower quality
        const moreCompressed = await compressImage(file, 600, 0.6)
        if (moreCompressed.length > 5 * 1024 * 1024) {
          throw new Error("Image is too large even after compression. Please use a smaller image.")
        }
        onChange(moreCompressed)
      } else {
        onChange(compressedDataUrl)
      }
    } catch (error) {
      console.error("Error processing image:", error)
      setError(error instanceof Error ? error.message : "Error processing image")
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleRemove = () => {
    onChange("")
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-start">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value ? (
        <div className="relative">
          <div className="aspect-square w-full max-w-xs mx-auto bg-gray-100 rounded-lg overflow-hidden">
            <img src={value || "/placeholder.svg"} alt="Product" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className={`
            aspect-square w-full max-w-xs mx-auto border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${dragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                <p className="text-sm text-gray-600">Compressing image...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                <p className="text-xs text-gray-400 mt-1">Images will be automatically compressed</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
