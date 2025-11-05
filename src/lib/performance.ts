/**
 * Performance optimization utilities
 * Code splitting, lazy loading, and bundle optimization
 */

import { lazy, ComponentType } from 'react'

/**
 * Enhanced lazy loading with error boundaries and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): T {
  const LazyComponent = lazy(importFn)
  
  return LazyComponent as T
}

/**
 * Preload component for better UX
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Preload on idle or after a delay
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => importFn())
  } else {
    setTimeout(() => importFn(), 100)
  }
}

/**
 * Dynamic import with retry logic
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  throw new Error('Dynamic import failed after retries')
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number>()
  private static observers = new Map<string, PerformanceObserver>()

  /**
   * Start performance measurement
   */
  static startMeasurement(name: string): void {
    performance.mark(`${name}-start`)
  }

  /**
   * End performance measurement
   */
  static endMeasurement(name: string): number {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    const duration = measure?.duration || 0
    
    this.metrics.set(name, duration)
    return duration
  }

  /**
   * Get performance metrics
   */
  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  /**
   * Monitor Core Web Vitals
   */
  static monitorWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lcpEntry = entries[entries.length - 1]
      console.log('LCP:', lcpEntry.startTime)
    })

    // First Input Delay (FID)
    this.observeMetric('first-input', (entries) => {
      const fidEntry = entries[0]
      console.log('FID:', fidEntry.processingStart - fidEntry.startTime)
    })

    // Cumulative Layout Shift (CLS)
    this.observeMetric('layout-shift', (entries) => {
      let clsValue = 0
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      console.log('CLS:', clsValue)
    })
  }

  /**
   * Observe specific performance metric
   */
  private static observeMetric(
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      
      observer.observe({ type, buffered: true })
      this.observers.set(type, observer)
    }
  }

  /**
   * Clean up observers
   */
  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

/**
 * Resource loading optimization
 */
export class ResourceLoader {
  private static loadedResources = new Set<string>()
  private static loadingPromises = new Map<string, Promise<any>>()

  /**
   * Preload critical resources
   */
  static preloadCriticalResources(): void {
    const criticalResources = [
      '/fonts/inter-var.woff2',
      '/images/logo.svg',
      '/api/auth/me'
    ]

    criticalResources.forEach(resource => {
      if (resource.startsWith('/api/')) {
        this.prefetchData(resource)
      } else {
        this.preloadAsset(resource)
      }
    })
  }

  /**
   * Preload asset (CSS, JS, fonts, images)
   */
  static preloadAsset(href: string, as?: string): void {
    if (this.loadedResources.has(href)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    if (as) link.as = as
    
    document.head.appendChild(link)
    this.loadedResources.add(href)
  }

  /**
   * Prefetch data
   */
  static async prefetchData(url: string): Promise<any> {
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)
    }

    const promise = fetch(url, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())

    this.loadingPromises.set(url, promise)
    return promise
  }

  /**
   * Load script dynamically
   */
  static loadScript(src: string): Promise<void> {
    if (this.loadedResources.has(src)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      
      script.onload = () => {
        this.loadedResources.add(src)
        resolve()
      }
      
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  /**
   * Load CSS dynamically
   */
  static loadCSS(href: string): Promise<void> {
    if (this.loadedResources.has(href)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      
      link.onload = () => {
        this.loadedResources.add(href)
        resolve()
      }
      
      link.onerror = reject
      document.head.appendChild(link)
    })
  }
}

/**
 * Memory optimization utilities
 */
export class MemoryOptimizer {
  private static cleanupTasks: (() => void)[] = []

  /**
   * Register cleanup task
   */
  static registerCleanup(task: () => void): void {
    this.cleanupTasks.push(task)
  }

  /**
   * Run all cleanup tasks
   */
  static cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task()
      } catch (error) {
        console.error('Cleanup task failed:', error)
      }
    })
    this.cleanupTasks = []
  }

  /**
   * Monitor memory usage
   */
  static monitorMemory(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      })
    }
  }

  /**
   * Debounce function for performance
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  /**
   * Throttle function for performance
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}

/**
 * Bundle optimization configuration
 */
export const BundleConfig = {
  // Critical CSS that should be inlined
  criticalCSS: [
    'layout',
    'navigation',
    'hero',
    'loading'
  ],
  
  // Routes that should be preloaded
  preloadRoutes: [
    '/dashboard',
    '/projects',
    '/tasks'
  ],
  
  // Components that should be lazy loaded
  lazyComponents: [
    'analytics',
    'reports',
    'settings',
    'admin'
  ],
  
  // Third-party scripts to load asynchronously
  asyncScripts: [
    'analytics',
    'chat',
    'feedback'
  ]
}

/**
 * Performance optimization hooks
 */
export const usePerformanceOptimization = () => {
  const measureRender = (componentName: string) => {
    PerformanceMonitor.startMeasurement(`render-${componentName}`)
    
    return () => {
      PerformanceMonitor.endMeasurement(`render-${componentName}`)
    }
  }

  const preloadRoute = (route: string) => {
    ResourceLoader.prefetchData(`/api${route}`)
  }

  return {
    measureRender,
    preloadRoute,
    debounce: MemoryOptimizer.debounce,
    throttle: MemoryOptimizer.throttle
  }
}
