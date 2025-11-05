'use client'

import { Navigation } from '@/components/navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="lg:pl-72">
        {children}
      </main>
    </div>
  )
}
