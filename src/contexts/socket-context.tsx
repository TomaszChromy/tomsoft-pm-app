'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useSocket } from '@/hooks/use-socket'

interface SocketContextType {
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false
})

export function useSocketContext() {
  return useContext(SocketContext)
}

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { isConnected } = useSocket()

  // Initialize socket connection on mount
  useEffect(() => {
    // Socket connection is handled by useSocket hook
    // This provider just makes the connection status available globally
  }, [])

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
