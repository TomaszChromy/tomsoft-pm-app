'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  BarChart3, 
  Users, 
  Bell,
  Menu,
  X
} from 'lucide-react'
import { useTouchGestures } from '@/hooks/use-touch-gestures'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'Projekty', icon: FolderOpen },
  { href: '/tasks', label: 'Zadania', icon: CheckSquare },
  { href: '/time-tracking', label: 'Czas', icon: Clock },
  { href: '/analytics', label: 'Analityka', icon: BarChart3 }
]

const secondaryNavItems: NavItem[] = [
  { href: '/team', label: 'Zespół', icon: Users },
  { href: '/notifications', label: 'Powiadomienia', icon: Bell, badge: 3 },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Find active tab index
  useEffect(() => {
    const activeIndex = mainNavItems.findIndex(item => pathname.startsWith(item.href))
    if (activeIndex !== -1) {
      setActiveTab(activeIndex)
    }
  }, [pathname])

  // Touch gestures for navigation
  const gestureRef = useTouchGestures({
    onSwipe: (gesture) => {
      if (gesture.direction === 'left' && activeTab < mainNavItems.length - 1) {
        // Swipe left to go to next tab
        const nextTab = activeTab + 1
        setActiveTab(nextTab)
        window.location.href = mainNavItems[nextTab].href
      } else if (gesture.direction === 'right' && activeTab > 0) {
        // Swipe right to go to previous tab
        const prevTab = activeTab - 1
        setActiveTab(prevTab)
        window.location.href = mainNavItems[prevTab].href
      } else if (gesture.direction === 'down') {
        // Swipe down to open menu
        setIsMenuOpen(true)
      }
    }
  }, {
    swipeThreshold: 80
  })

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      {/* Bottom Tab Bar */}
      <div 
        ref={gestureRef}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {mainNavItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab(index)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-600'}`} />
                <span className={`text-xs mt-1 font-medium ${
                  isActive ? 'text-indigo-600' : 'text-slate-600'
                }`}>
                  {item.label}
                </span>
                {item.badge && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </div>
                )}
              </Link>
            )
          })}
          
          {/* Menu button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Menu</span>
          </button>
        </div>
        
        {/* Active tab indicator */}
        <div 
          className="absolute top-0 h-1 bg-indigo-600 transition-all duration-300 ease-out"
          style={{
            left: `${(activeTab / mainNavItems.length) * 100}%`,
            width: `${100 / mainNavItems.length}%`
          }}
        />
      </div>

      {/* Slide-up Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={closeMenu}
          />
          
          {/* Menu Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden animate-slide-up">
            <div className="p-6">
              {/* Handle */}
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-6" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
                <button
                  onClick={closeMenu}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Secondary Navigation */}
              <div className="space-y-2 mb-6">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname.startsWith(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-600' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <div className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {item.badge}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
              
              {/* Quick Actions */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-medium text-slate-900 mb-3">Szybkie akcje</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/tasks/new"
                    onClick={closeMenu}
                    className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <CheckSquare className="w-6 h-6 text-indigo-600 mb-2" />
                    <span className="text-sm font-medium text-indigo-600">Nowe zadanie</span>
                  </Link>
                  
                  <Link
                    href="/projects/new"
                    onClick={closeMenu}
                    className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <FolderOpen className="w-6 h-6 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-green-600">Nowy projekt</span>
                  </Link>
                </div>
              </div>
              
              {/* App Info */}
              <div className="border-t border-slate-200 pt-6 mt-6">
                <div className="text-center">
                  <p className="text-xs text-slate-500">TomSoft PM v1.0.0</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Przesuń w lewo/prawo aby przełączać zakładki
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer for bottom navigation */}
      <div className="h-16 md:hidden" />
    </>
  )
}

// CSS for slide-up animation (add to globals.css)
export const mobileNavigationStyles = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`
