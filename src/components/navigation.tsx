'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
// Temporarily disabled to fix runtime error
// import { NotificationCenter } from '@/components/notifications/notification-center'
// import { OnlineUsers } from '@/components/realtime/online-users'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { KeyboardShortcutsButton } from '@/components/ui/keyboard-shortcuts-modal'
import { useGlobalKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import {
  BarChart3,
  FolderOpen,
  CheckSquare,
  Users,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Search,
  User,
  LayoutDashboard,
  Clock,
  Zap,
  FileText,
  Bell
} from 'lucide-react'

export function Navigation() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Initialize global keyboard shortcuts
  useGlobalKeyboardShortcuts()

  // Filter navigation items based on user role
  const getNavigationItems = () => {
    if (user?.role === 'CLIENT') {
      return [
        { name: 'Portal Klienta', href: '/client-portal', icon: LayoutDashboard },
      ]
    }

    return [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projekty', href: '/projects', icon: FolderOpen },
      { name: 'Zadania', href: '/tasks', icon: CheckSquare },
      { name: 'Sprinty', href: '/sprints', icon: Zap },
      { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
      { name: 'Zespół', href: '/team', icon: Users },
      { name: 'Analityka', href: '/analytics', icon: BarChart3 },
      { name: 'Raporty', href: '/reports', icon: FileText },
    ]
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-gray-100">TomSoft PM</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {getNavigationItems().map((item) => {
              const isActive = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                      : 'text-slate-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-gray-500'
                  }`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-200 dark:border-gray-700">
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{user?.email}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{user?.role}</p>
                </div>
              </button>

              {/* User Menu */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profil
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Ustawienia
                  </Link>
                  <Link
                    href="/integrations"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Zap className="w-4 h-4" />
                    Integracje
                  </Link>
                  <Link
                    href="/notifications/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Bell className="w-4 h-4" />
                    Powiadomienia
                  </Link>
                  <hr className="my-1 border-slate-200 dark:border-gray-700" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Wyloguj
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top bar for mobile */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-gray-100">TomSoft PM</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-search-input
              className="p-2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <KeyboardShortcutsButton />
            {/* Temporarily disabled to fix runtime error */}
            {/* <NotificationCenter /> */}
            {/* <OnlineUsers showCount={false} maxVisible={3} size="sm" /> */}
          </div>
        </div>
      </div>
    </>
  )
}


