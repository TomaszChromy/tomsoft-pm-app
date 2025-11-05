/**
 * Rate limiting implementation using in-memory storage
 * For production, consider using Redis for distributed rate limiting
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

class InMemoryStore {
  private store = new Map<string, RateLimitEntry>()

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key)
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now()
    const existing = this.get(key)

    if (existing) {
      existing.count++
      return existing
    }

    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
      firstRequest: now,
    }
    this.set(key, newEntry)
    return newEntry
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

export class RateLimiter {
  private store = new InMemoryStore()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.store.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Check if request should be rate limited
   */
  isRateLimited(identifier: string, config: RateLimitConfig): {
    limited: boolean
    remaining: number
    resetTime: number
    totalHits: number
  } {
    const entry = this.store.increment(identifier, config.windowMs)
    
    const limited = entry.count > config.maxRequests
    const remaining = Math.max(0, config.maxRequests - entry.count)

    return {
      limited,
      remaining,
      resetTime: entry.resetTime,
      totalHits: entry.count,
    }
  }

  /**
   * Get rate limit status without incrementing
   */
  getStatus(identifier: string): {
    count: number
    resetTime: number
    firstRequest: number
  } | null {
    const entry = this.store.get(identifier)
    return entry || null
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // General API requests
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later',
  },

  // Authentication endpoints
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later',
  },

  AUTH_REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later',
  },

  AUTH_PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later',
  },

  // 2FA endpoints
  TWO_FACTOR_VERIFY: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many 2FA verification attempts, please try again later',
  },

  // File upload endpoints
  FILE_UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many file uploads, please try again later',
  },

  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please slow down',
  },

  // Admin endpoints
  ADMIN_ACTIONS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Too many admin actions, please try again later',
  },

  // Integration webhooks
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Webhook rate limit exceeded',
  },
} as const

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try to get user ID from authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      // In a real implementation, you'd decode the JWT to get user ID
      // For now, we'll use the token itself as identifier
      return `user:${authHeader.slice(7, 20)}` // First 13 chars of token
    } catch {
      // Fall through to IP-based identification
    }
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Create rate limit middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  return (request: Request): Response | null => {
    const identifier = getClientIdentifier(request)
    const result = rateLimiter.isRateLimited(identifier, config)

    if (result.limited) {
      const resetDate = new Date(result.resetTime)
      
      return new Response(
        JSON.stringify({
          error: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    return null // Not rate limited
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  identifier: string,
  config: RateLimitConfig
): Response {
  const result = rateLimiter.isRateLimited(identifier, config)
  
  const headers = new Headers(response.headers)
  headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.resetTime.toString())

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
