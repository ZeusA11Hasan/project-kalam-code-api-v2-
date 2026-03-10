"use client"

import { FC, useRef, useState } from "react"
import { Input } from "./input"
import { Label } from "./label"

interface ImagePickerProps {
  src: string
  image: File | null
  onSrcChange: (src: string) => void
  onImageChange: (image: File) => void
  width?: number
  height?: number
}

export const ImagePicker: FC<ImagePickerProps> = ({
  src,
  image,
  onSrcChange,
  onImageChange,
  width = 200,
  height = 200
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewSrc, setPreviewSrc] = useState(src)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      onImageChange(file)
      const reader = new FileReader()
      reader.onload = e => {
        if (e.target?.result) {
          setPreviewSrc(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="border-input bg-background relative cursor-pointer overflow-hidden rounded-lg border"
        style={{ width, height }}
        onClick={() => fileInputRef.current?.click()}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="Preview"
            className="size-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            Click to upload
          </div>
        )}
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="w-full">
        <Label>Or enter image URL</Label>
        <Input
          type="url"
          placeholder="https://..."
          value={src}
          onChange={e => {
            onSrcChange(e.target.value)
            setPreviewSrc(e.target.value)
          }}
        />
      </div>
    </div>
  )
}

export default ImagePicker
