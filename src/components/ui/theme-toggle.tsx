'use client'

import { useTheme } from '@/contexts/theme-context'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  ] as const

  const currentTheme = themes.find(t => t.value === theme) || themes[2]
  const CurrentIcon = currentTheme.icon

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors">
          <CurrentIcon className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
          <div className="py-1">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              return (
                <Menu.Item key={themeOption.value}>
                  {({ active }) => (
                    <button
                      onClick={() => setTheme(themeOption.value)}
                      className={`${
                        active
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300'
                      } ${
                        theme === themeOption.value
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : ''
                      } group flex items-center w-full px-4 py-2 text-sm transition-colors`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {themeOption.label}
                      {theme === themeOption.value && (
                        <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              )
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
}
