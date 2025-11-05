'use client'

import { useRef, useEffect, useCallback } from 'react'

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

interface PinchGesture {
  scale: number
  center: { x: number; y: number }
}

interface TapGesture {
  x: number
  y: number
  tapCount: number
}

interface GestureCallbacks {
  onSwipe?: (gesture: SwipeGesture) => void
  onPinch?: (gesture: PinchGesture) => void
  onTap?: (gesture: TapGesture) => void
  onDoubleTap?: (gesture: TapGesture) => void
  onLongPress?: (point: TouchPoint) => void
  onPan?: (delta: { x: number; y: number }, point: TouchPoint) => void
}

interface GestureOptions {
  swipeThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
  pinchThreshold?: number
  panThreshold?: number
}

export function useTouchGestures(
  callbacks: GestureCallbacks,
  options: GestureOptions = {}
) {
  const elementRef = useRef<HTMLElement>(null)
  const touchStartRef = useRef<TouchPoint | null>(null)
  const touchesRef = useRef<Touch[]>([])
  const lastTapRef = useRef<TouchPoint | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isPanningRef = useRef(false)

  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    pinchThreshold = 10,
    panThreshold = 10
  } = options

  const getDistance = useCallback((point1: TouchPoint, point2: TouchPoint) => {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getDirection = useCallback((start: TouchPoint, end: TouchPoint): SwipeGesture['direction'] => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    } else {
      return dy > 0 ? 'down' : 'up'
    }
  }, [])

  const getTouchPoint = useCallback((touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now()
  }), [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touches = Array.from(event.touches)
    touchesRef.current = touches

    if (touches.length === 1) {
      const touch = touches[0]
      const point = getTouchPoint(touch)
      touchStartRef.current = point
      isPanningRef.current = false

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        if (callbacks.onLongPress && touchStartRef.current) {
          callbacks.onLongPress(touchStartRef.current)
        }
      }, longPressDelay)
    } else if (touches.length === 2) {
      // Clear long press timer for multi-touch
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [callbacks.onLongPress, longPressDelay, getTouchPoint])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touches = Array.from(event.touches)
    
    if (touches.length === 1 && touchStartRef.current) {
      const touch = touches[0]
      const currentPoint = getTouchPoint(touch)
      const distance = getDistance(touchStartRef.current, currentPoint)

      // Clear long press timer if moved too much
      if (distance > panThreshold && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      // Handle panning
      if (distance > panThreshold && callbacks.onPan) {
        if (!isPanningRef.current) {
          isPanningRef.current = true
        }
        
        const delta = {
          x: currentPoint.x - touchStartRef.current.x,
          y: currentPoint.y - touchStartRef.current.y
        }
        
        callbacks.onPan(delta, currentPoint)
      }
    } else if (touches.length === 2 && callbacks.onPinch) {
      // Handle pinch gesture
      const touch1 = touches[0]
      const touch2 = touches[1]
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }

      // Calculate scale based on initial distance
      if (touchesRef.current.length === 2) {
        const initialTouch1 = touchesRef.current[0]
        const initialTouch2 = touchesRef.current[1]
        
        const initialDistance = Math.sqrt(
          Math.pow(initialTouch2.clientX - initialTouch1.clientX, 2) +
          Math.pow(initialTouch2.clientY - initialTouch1.clientY, 2)
        )
        
        const scale = currentDistance / initialDistance
        
        if (Math.abs(scale - 1) > pinchThreshold / 100) {
          callbacks.onPinch({ scale, center })
        }
      }
    }
  }, [callbacks.onPan, callbacks.onPinch, getDistance, getTouchPoint, panThreshold, pinchThreshold])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const touches = Array.from(event.changedTouches)
    
    if (touches.length === 1 && touchStartRef.current && !isPanningRef.current) {
      const touch = touches[0]
      const endPoint = getTouchPoint(touch)
      const distance = getDistance(touchStartRef.current, endPoint)
      const duration = endPoint.timestamp - touchStartRef.current.timestamp

      if (distance >= swipeThreshold && duration < 1000) {
        // Handle swipe
        const direction = getDirection(touchStartRef.current, endPoint)
        const velocity = distance / duration
        
        if (callbacks.onSwipe) {
          callbacks.onSwipe({
            direction,
            distance,
            velocity,
            duration
          })
        }
      } else if (distance < panThreshold) {
        // Handle tap
        const now = Date.now()
        
        if (lastTapRef.current && 
            now - lastTapRef.current.timestamp < doubleTapDelay &&
            getDistance(lastTapRef.current, endPoint) < 50) {
          // Double tap
          if (callbacks.onDoubleTap) {
            callbacks.onDoubleTap({
              x: endPoint.x,
              y: endPoint.y,
              tapCount: 2
            })
          }
          lastTapRef.current = null
        } else {
          // Single tap
          if (callbacks.onTap) {
            callbacks.onTap({
              x: endPoint.x,
              y: endPoint.y,
              tapCount: 1
            })
          }
          lastTapRef.current = endPoint
        }
      }
    }

    // Reset state
    touchStartRef.current = null
    isPanningRef.current = false
    touchesRef.current = []
  }, [
    callbacks.onSwipe,
    callbacks.onTap,
    callbacks.onDoubleTap,
    getDistance,
    getDirection,
    getTouchPoint,
    swipeThreshold,
    doubleTapDelay,
    panThreshold
  ])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      
      // Clear any pending timers
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return elementRef
}

// Helper hook for common mobile interactions
export function useMobileInteractions() {
  const preventZoom = useCallback((event: TouchEvent) => {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  }, [])

  const preventPullToRefresh = useCallback((event: TouchEvent) => {
    const element = event.target as HTMLElement
    const scrollTop = element.scrollTop || document.documentElement.scrollTop
    
    if (scrollTop === 0 && event.touches.length === 1) {
      const touch = event.touches[0]
      const startY = touch.clientY
      
      const handleMove = (moveEvent: TouchEvent) => {
        const currentTouch = moveEvent.touches[0]
        const deltaY = currentTouch.clientY - startY
        
        if (deltaY > 0) {
          moveEvent.preventDefault()
        }
      }
      
      const handleEnd = () => {
        document.removeEventListener('touchmove', handleMove)
        document.removeEventListener('touchend', handleEnd)
      }
      
      document.addEventListener('touchmove', handleMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
    }
  }, [])

  useEffect(() => {
    // Prevent zoom on double tap
    document.addEventListener('touchstart', preventZoom, { passive: false })
    
    // Prevent pull to refresh
    document.addEventListener('touchstart', preventPullToRefresh, { passive: false })

    return () => {
      document.removeEventListener('touchstart', preventZoom)
      document.removeEventListener('touchstart', preventPullToRefresh)
    }
  }, [preventZoom, preventPullToRefresh])

  return {
    preventZoom,
    preventPullToRefresh
  }
}
