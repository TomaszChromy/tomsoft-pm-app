import multer from 'multer'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { NextRequest } from 'next/server'

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'public', 'uploads')
const avatarsDir = path.join(uploadDir, 'avatars')
const attachmentsDir = path.join(uploadDir, 'attachments')
const documentsDir = path.join(uploadDir, 'documents')

// Create directories if they don't exist
[uploadDir, avatarsDir, attachmentsDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// File type validation
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const allowedDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

// Generate unique filename
function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = path.extname(originalName)
  return `${timestamp}-${random}${extension}`
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = attachmentsDir
    
    if (file.fieldname === 'avatar') {
      uploadPath = avatarsDir
    } else if (file.fieldname === 'document') {
      uploadPath = documentsDir
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname)
    cb(null, fileName)
  }
})

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'avatar') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Nieprawidłowy typ pliku. Dozwolone są tylko obrazy (JPEG, PNG, GIF, WebP).'))
    }
  } else if (file.fieldname === 'document') {
    if (allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Nieprawidłowy typ pliku. Dozwolone są dokumenty PDF, Word, Excel i pliki tekstowe.'))
    }
  } else {
    // General attachment
    if ([...allowedImageTypes, ...allowedDocumentTypes].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Nieprawidłowy typ pliku.'))
    }
  }
}

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 5 // Maximum 5 files per request
  }
})

// Image processing for avatars
export async function processAvatar(filePath: string): Promise<string> {
  try {
    const processedFileName = `processed-${path.basename(filePath)}`
    const processedPath = path.join(avatarsDir, processedFileName)
    
    await sharp(filePath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(processedPath)
    
    // Delete original file
    fs.unlinkSync(filePath)
    
    return `/uploads/avatars/${processedFileName}`
  } catch (error) {
    console.error('Error processing avatar:', error)
    throw new Error('Błąd podczas przetwarzania obrazu')
  }
}

// File upload handler for API routes
export async function handleFileUpload(
  request: NextRequest,
  fieldName: string = 'file'
): Promise<{
  success: boolean
  files?: Array<{
    originalName: string
    fileName: string
    path: string
    size: number
    mimetype: string
  }>
  error?: string
}> {
  try {
    const formData = await request.formData()
    const files = formData.getAll(fieldName) as File[]
    
    if (!files || files.length === 0) {
      return { success: false, error: 'Nie wybrano plików' }
    }
    
    const uploadedFiles = []
    
    for (const file of files) {
      // Validate file size
      const maxSize = allowedImageTypes.includes(file.type) ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE
      if (file.size > maxSize) {
        return { 
          success: false, 
          error: `Plik ${file.name} jest za duży. Maksymalny rozmiar: ${maxSize / (1024 * 1024)}MB` 
        }
      }
      
      // Validate file type
      if (![...allowedImageTypes, ...allowedDocumentTypes].includes(file.type)) {
        return { 
          success: false, 
          error: `Nieprawidłowy typ pliku: ${file.name}` 
        }
      }
      
      // Generate filename and path
      const fileName = generateFileName(file.name)
      let uploadPath = attachmentsDir
      
      if (allowedImageTypes.includes(file.type)) {
        uploadPath = avatarsDir
      } else if (allowedDocumentTypes.includes(file.type)) {
        uploadPath = documentsDir
      }
      
      const filePath = path.join(uploadPath, fileName)
      
      // Save file
      const buffer = await file.arrayBuffer()
      fs.writeFileSync(filePath, Buffer.from(buffer))
      
      // Process avatar if it's an image for avatar
      let finalPath = filePath
      let finalFileName = fileName
      
      if (fieldName === 'avatar' && allowedImageTypes.includes(file.type)) {
        const processedUrl = await processAvatar(filePath)
        finalPath = path.join(process.cwd(), 'public', processedUrl.substring(1))
        finalFileName = path.basename(processedUrl)
      }
      
      uploadedFiles.push({
        originalName: file.name,
        fileName: finalFileName,
        path: finalPath.replace(path.join(process.cwd(), 'public'), ''),
        size: file.size,
        mimetype: file.type
      })
    }
    
    return { success: true, files: uploadedFiles }
  } catch (error) {
    console.error('File upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Błąd podczas przesyłania pliku' 
    }
  }
}

// Delete file
export function deleteFile(filePath: string): boolean {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

// Get file info
export function getFileInfo(filePath: string): {
  exists: boolean
  size?: number
  mimetype?: string
  lastModified?: Date
} {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath)
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath)
      return {
        exists: true,
        size: stats.size,
        lastModified: stats.mtime
      }
    }
    return { exists: false }
  } catch (error) {
    console.error('Error getting file info:', error)
    return { exists: false }
  }
}

// Clean up old files (run periodically)
export function cleanupOldFiles(daysOld: number = 30): number {
  let deletedCount = 0
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)
  
  const directories = [avatarsDir, attachmentsDir, documentsDir]
  
  directories.forEach(dir => {
    try {
      const files = fs.readdirSync(dir)
      files.forEach(file => {
        const filePath = path.join(dir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          deletedCount++
        }
      })
    } catch (error) {
      console.error(`Error cleaning up directory ${dir}:`, error)
    }
  })
  
  console.log(`Cleaned up ${deletedCount} old files`)
  return deletedCount
}
