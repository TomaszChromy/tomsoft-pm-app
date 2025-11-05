/**
 * Image optimization utilities
 * Handles image compression, resizing, and format conversion
 */

interface ImageOptimizationOptions {
  quality?: number // 0-100
  width?: number
  height?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

interface OptimizedImage {
  buffer: Buffer
  format: string
  width: number
  height: number
  size: number
}

export class ImageOptimizer {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly DEFAULT_QUALITY = 80
  private static readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg']

  /**
   * Validate image file
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !this.SUPPORTED_FORMATS.includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file format. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`
      }
    }

    // Check MIME type
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'File is not an image'
      }
    }

    return { valid: true }
  }

  /**
   * Generate responsive image sizes
   */
  static generateResponsiveSizes(originalWidth: number, originalHeight: number): Array<{
    width: number
    height: number
    suffix: string
  }> {
    const aspectRatio = originalWidth / originalHeight
    
    const sizes = [
      { width: 320, suffix: 'xs' },
      { width: 640, suffix: 'sm' },
      { width: 768, suffix: 'md' },
      { width: 1024, suffix: 'lg' },
      { width: 1280, suffix: 'xl' },
      { width: 1920, suffix: '2xl' },
    ]

    return sizes
      .filter(size => size.width <= originalWidth)
      .map(size => ({
        width: size.width,
        height: Math.round(size.width / aspectRatio),
        suffix: size.suffix
      }))
  }

  /**
   * Generate optimized image URL for Next.js Image component
   */
  static generateImageUrl(
    src: string,
    options: ImageOptimizationOptions = {}
  ): string {
    const params = new URLSearchParams()
    
    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    if (options.quality) params.set('q', options.quality.toString())
    if (options.format) params.set('f', options.format)
    if (options.fit) params.set('fit', options.fit)

    const queryString = params.toString()
    return queryString ? `${src}?${queryString}` : src
  }

  /**
   * Get image metadata from file
   */
  static async getImageMetadata(file: File): Promise<{
    width: number
    height: number
    format: string
    size: number
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: file.type.split('/')[1],
          size: file.size
        })
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Create image thumbnail
   */
  static createThumbnail(
    src: string,
    size: number = 150,
    quality: number = 70
  ): string {
    return this.generateImageUrl(src, {
      width: size,
      height: size,
      quality,
      fit: 'cover',
      format: 'webp'
    })
  }

  /**
   * Generate srcSet for responsive images
   */
  static generateSrcSet(
    src: string,
    sizes: Array<{ width: number; suffix: string }>
  ): string {
    return sizes
      .map(size => {
        const url = this.generateImageUrl(src, { width: size.width, format: 'webp' })
        return `${url} ${size.width}w`
      })
      .join(', ')
  }

  /**
   * Get optimal image format based on browser support
   */
  static getOptimalFormat(userAgent?: string): 'avif' | 'webp' | 'jpeg' {
    if (!userAgent) return 'webp'
    
    // Check for AVIF support (Chrome 85+, Firefox 93+)
    if (userAgent.includes('Chrome/') && 
        parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || '0') >= 85) {
      return 'avif'
    }
    
    // Check for WebP support (most modern browsers)
    if (userAgent.includes('Chrome/') || 
        userAgent.includes('Firefox/') || 
        userAgent.includes('Safari/')) {
      return 'webp'
    }
    
    return 'jpeg'
  }

  /**
   * Calculate image compression ratio
   */
  static calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    return Math.round((1 - compressedSize / originalSize) * 100)
  }

  /**
   * Generate blur placeholder for images
   */
  static generateBlurDataURL(width: number = 10, height: number = 10): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    // Create gradient blur effect
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    return canvas.toDataURL()
  }
}

/**
 * Image upload configuration
 */
export const ImageUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  thumbnailSize: 150,
  responsiveSizes: [320, 640, 768, 1024, 1280, 1920],
  defaultQuality: 80,
  compressionQuality: {
    thumbnail: 70,
    small: 75,
    medium: 80,
    large: 85,
    original: 90
  }
}

/**
 * Image processing utilities for different use cases
 */
export class ImageProcessor {
  /**
   * Process avatar image
   */
  static processAvatar(src: string): {
    thumbnail: string
    small: string
    medium: string
  } {
    return {
      thumbnail: ImageOptimizer.createThumbnail(src, 40, 70),
      small: ImageOptimizer.generateImageUrl(src, { width: 80, height: 80, fit: 'cover', format: 'webp' }),
      medium: ImageOptimizer.generateImageUrl(src, { width: 150, height: 150, fit: 'cover', format: 'webp' })
    }
  }

  /**
   * Process project image
   */
  static processProjectImage(src: string): {
    thumbnail: string
    card: string
    hero: string
    srcSet: string
  } {
    const sizes = [
      { width: 320, suffix: 'sm' },
      { width: 640, suffix: 'md' },
      { width: 1024, suffix: 'lg' },
      { width: 1280, suffix: 'xl' }
    ]

    return {
      thumbnail: ImageOptimizer.createThumbnail(src, 150),
      card: ImageOptimizer.generateImageUrl(src, { width: 400, height: 250, fit: 'cover', format: 'webp' }),
      hero: ImageOptimizer.generateImageUrl(src, { width: 1200, height: 400, fit: 'cover', format: 'webp' }),
      srcSet: ImageOptimizer.generateSrcSet(src, sizes)
    }
  }

  /**
   * Process attachment image
   */
  static processAttachment(src: string): {
    thumbnail: string
    preview: string
    full: string
  } {
    return {
      thumbnail: ImageOptimizer.createThumbnail(src, 100),
      preview: ImageOptimizer.generateImageUrl(src, { width: 600, height: 400, fit: 'contain', format: 'webp' }),
      full: ImageOptimizer.generateImageUrl(src, { quality: 90, format: 'webp' })
    }
  }
}

/**
 * Client-side image optimization hooks
 */
export const useImageOptimization = () => {
  const optimizeImage = async (file: File, options: ImageOptimizationOptions = {}) => {
    const validation = ImageOptimizer.validateImage(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const metadata = await ImageOptimizer.getImageMetadata(file)
    
    return {
      file,
      metadata,
      urls: {
        thumbnail: ImageOptimizer.createThumbnail(URL.createObjectURL(file)),
        optimized: ImageOptimizer.generateImageUrl(URL.createObjectURL(file), options)
      }
    }
  }

  return { optimizeImage }
}
