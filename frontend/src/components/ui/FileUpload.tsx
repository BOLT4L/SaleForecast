import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import { Upload, File, X } from "lucide-react"
import { Button } from "./Button"
import { Progress } from "./Progress"
import { cn } from "../../utils/cn"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onUploadProgress?: (progress: number) => void
  accept?: string
  maxSize?: number // in bytes
  disabled?: boolean
  className?: string
}

export function FileUpload({
  onFileSelect,
  onUploadProgress,
  accept = ".csv,.xlsx,.xls",
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    }

    if (accept) {
      const acceptedTypes = accept.split(",").map((type) => type.trim())
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

      if (!acceptedTypes.includes(fileExtension)) {
        return `File type not supported. Accepted types: ${accept}`
      }
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)
    onFileSelect(file)

    // Simulate upload progress
    if (onUploadProgress) {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)
        onUploadProgress(progress)

        if (progress >= 100) {
          clearInterval(interval)
        }
      }, 100)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : disabled
              ? "border-muted bg-muted/20 cursor-not-allowed"
              : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <Upload className={cn("w-12 h-12", disabled ? "text-muted-foreground" : "text-muted-foreground")} />

          <div>
            {isDragOver ? (
              <p className="text-lg font-medium">Drop the file here</p>
            ) : (
              <>
                <p className="text-lg font-medium">Drag & drop a file here</p>
                <p className="text-muted-foreground">or click to select a file</p>
              </>
            )}
          </div>

          {accept && <p className="text-sm text-muted-foreground">Accepted formats: {accept}</p>}
        </div>
      </div>

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <File className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>}
    </div>
  )
}
