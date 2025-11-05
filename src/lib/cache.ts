/**
 * Caching system for improved performance
 * Uses in-memory storage with TTL support
 * For production, consider using Redis
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize: number
  private cleanupInterval: NodeJS.Timeout

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const now = Date.now()
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      expiresAt: now + ttl,
      createdAt: now,
    })
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    memoryUsage: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need hit/miss tracking
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let size = 0
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2 // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2
      size += 64 // Overhead for entry object
    }
    return size
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Global cache instances
export const appCache = new MemoryCache({ maxSize: 1000, ttl: 5 * 60 * 1000 })
export const userCache = new MemoryCache({ maxSize: 500, ttl: 10 * 60 * 1000 })
export const projectCache = new MemoryCache({ maxSize: 200, ttl: 15 * 60 * 1000 })
export const taskCache = new MemoryCache({ maxSize: 1000, ttl: 5 * 60 * 1000 })

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  project: (id: string) => `project:${id}`,
  projectMembers: (id: string) => `project:${id}:members`,
  projectTasks: (id: string) => `project:${id}:tasks`,
  task: (id: string) => `task:${id}`,
  taskComments: (id: string) => `task:${id}:comments`,
  userProjects: (userId: string) => `user:${userId}:projects`,
  userTasks: (userId: string) => `user:${userId}:tasks`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
}

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = CacheTTL.MEDIUM,
  cache: MemoryCache = appCache
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    
    // Try to get from cache
    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = await fn(...args)
    cache.set(key, result, ttl)
    
    return result
  }) as T
}

/**
 * Cache invalidation helpers
 */
export class CacheInvalidator {
  /**
   * Invalidate user-related cache
   */
  static invalidateUser(userId: string): void {
    userCache.delete(CacheKeys.user(userId))
    userCache.delete(CacheKeys.userProjects(userId))
    userCache.delete(CacheKeys.userTasks(userId))
    appCache.delete(CacheKeys.dashboard(userId))
  }

  /**
   * Invalidate project-related cache
   */
  static invalidateProject(projectId: string): void {
    projectCache.delete(CacheKeys.project(projectId))
    projectCache.delete(CacheKeys.projectMembers(projectId))
    projectCache.delete(CacheKeys.projectTasks(projectId))
    
    // Invalidate analytics that might include this project
    this.invalidateAnalytics()
  }

  /**
   * Invalidate task-related cache
   */
  static invalidateTask(taskId: string, projectId?: string, userId?: string): void {
    taskCache.delete(CacheKeys.task(taskId))
    taskCache.delete(CacheKeys.taskComments(taskId))
    
    if (projectId) {
      projectCache.delete(CacheKeys.projectTasks(projectId))
    }
    
    if (userId) {
      userCache.delete(CacheKeys.userTasks(userId))
      appCache.delete(CacheKeys.dashboard(userId))
    }
  }

  /**
   * Invalidate analytics cache
   */
  static invalidateAnalytics(): void {
    // Clear all analytics cache entries
    const analyticsKeys = Array.from(appCache['cache'].keys()).filter(key => 
      key.startsWith('analytics:')
    )
    
    analyticsKeys.forEach(key => appCache.delete(key))
  }

  /**
   * Invalidate all cache
   */
  static invalidateAll(): void {
    appCache.clear()
    userCache.clear()
    projectCache.clear()
    taskCache.clear()
  }
}
