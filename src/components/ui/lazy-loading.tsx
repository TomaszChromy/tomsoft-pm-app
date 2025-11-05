'use client'

import React, { Suspense, lazy, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
    </div>
  )
}

/**
 * Loading skeleton for different content types
 */
export const LoadingSkeleton = {
  Card: () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
    </div>
  ),

  Table: () => (
    <div className="animate-pulse space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4 p-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  ),

  Chart: () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  ),

  Form: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
    </div>
  ),

  Avatar: () => (
    <div className="animate-pulse">
      <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    </div>
  ),

  Text: ({ lines = 3 }: { lines?: number }) => (
    <div className="animate-pulse space-y-2">
      {[...Array(lines)].map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-300 dark:bg-gray-600 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  )
}

/**
 * Enhanced lazy wrapper with error boundary
 */
interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ComponentType
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback: Fallback = LoadingSpinner,
  errorFallback: ErrorFallback 
}) => {
  const [hasError, setHasError] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const retry = () => {
    setHasError(false)
    setError(null)
  }

  if (hasError && ErrorFallback && error) {
    return <ErrorFallback error={error} retry={retry} />
  }

  return (
    <Suspense fallback={<Fallback />}>
      <ErrorBoundary onError={(error) => {
        setHasError(true)
        setError(error)
      }}>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}

/**
 * Error boundary component
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error)
    console.error('Lazy loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return null // Let parent handle error display
    }

    return this.props.children
  }
}

/**
 * Lazy loaded components with proper fallbacks
 * Note: Only include components that actually exist
 */

/**
 * Preload utilities
 * Note: Only include components that actually exist
 */
export const preloadComponents = {
  // Add actual existing components here when needed
}

/**
 * Intersection Observer for lazy loading
 */
export const useLazyLoad = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

/**
 * Lazy load on scroll component
 */
interface LazyOnScrollProps {
  children: React.ReactNode
  fallback?: React.ComponentType
  threshold?: number
  className?: string
}

export const LazyOnScroll: React.FC<LazyOnScrollProps> = ({
  children,
  fallback: Fallback = LoadingSpinner,
  threshold = 0.1,
  className = ''
}) => {
  const { ref, isVisible } = useLazyLoad(threshold)

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : <Fallback />}
    </div>
  )
}

/**
 * Route-based lazy loading
 */
export const createLazyRoute = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) => {
  const LazyComponent = lazy(importFn)
  
  return (props: React.ComponentProps<T>) => (
    <LazyWrapper fallback={fallback}>
      <LazyComponent {...props} />
    </LazyWrapper>
  )
}

/**
 * Performance-aware lazy loading
 */
export const usePerformanceLazyLoad = () => {
  const [shouldLoad, setShouldLoad] = React.useState(false)

  React.useEffect(() => {
    // Check connection speed
    const connection = (navigator as any).connection
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g'
    )

    // Check device memory
    const deviceMemory = (navigator as any).deviceMemory
    const isLowMemory = deviceMemory && deviceMemory < 4

    // Delay loading on slow connections or low memory devices
    const delay = isSlowConnection || isLowMemory ? 2000 : 500

    const timer = setTimeout(() => setShouldLoad(true), delay)
    return () => clearTimeout(timer)
  }, [])

  return shouldLoad
}
