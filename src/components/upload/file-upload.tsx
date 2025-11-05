'use client'

import { useState, useRef } from 'react'
import { Upload, X, File, Image, FileText, Download, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface FileUploadProps {
  taskId?: string
  projectId?: string
  type?: 'attachment' | 'avatar' | 'document'
  multiple?: boolean
  accept?: string
  maxSize?: number // in MB
  onUploadComplete?: (files: any[]) => void
  className?: string
}

export function FileUpload({
  taskId,
  projectId,
  type = 'attachment',
  multiple = true,
  accept,
  maxSize = 10,
  onUploadComplete,
  className = ''
}: FileUploadProps) {
  const { token } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getAcceptedTypes = () => {
    if (accept) return accept
    
    switch (type) {
      case 'avatar':
        return 'image/*'
      case 'document':
        return '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv'
      default:
        return 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv'
    }
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `Plik ${file.name} jest za duży. Maksymalny rozmiar: ${maxSize}MB`
    }

    // Check file type for avatar
    if (type === 'avatar' && !file.type.startsWith('image/')) {
      return 'Avatar musi być obrazem'
    }

    return null
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const errors: string[] = []

    // Validate files
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    uploadFiles(fileArray)
  }

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const params = new URLSearchParams()
      if (type) params.append('type', type)
      if (taskId) params.append('taskId', taskId)
      if (projectId) params.append('projectId', projectId)

      const response = await fetch(`/api/upload?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Błąd podczas przesyłania plików')
      }

      const result = await response.json()
      setUploadedFiles(prev => [...prev, ...result.attachments])
      
      if (onUploadComplete) {
        onUploadComplete(result.attachments)
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Błąd podczas przesyłania plików')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    } else if (mimeType.includes('pdf')) {
      return <FileText className="w-4 h-4 text-red-500" />
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-4 h-4 text-blue-500" />
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileText className="w-4 h-4 text-green-500" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptedTypes()}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        
        {isUploading ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Przesyłanie plików...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Przeciągnij pliki tutaj lub{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                wybierz pliki
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Maksymalny rozmiar: {maxSize}MB
              {type === 'avatar' && ' • Tylko obrazy'}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Przesłane pliki:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.mimeType || '')}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.fileSize || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.filePath && (
                    <a
                      href={file.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Pobierz plik"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Usuń plik"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
