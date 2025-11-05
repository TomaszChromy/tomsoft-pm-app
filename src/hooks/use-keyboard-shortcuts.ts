'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  category?: string
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return
      }

      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.metaKey === event.metaKey
        )
      })

      if (matchingShortcut) {
        if (preventDefault) {
          event.preventDefault()
        }
        matchingShortcut.action()
      }
    },
    [shortcuts, enabled, preventDefault]
  )

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

// Global keyboard shortcuts hook
export function useGlobalKeyboardShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'd',
      altKey: true,
      action: () => router.push('/dashboard'),
      description: 'Go to Dashboard',
      category: 'Navigation'
    },
    {
      key: 'p',
      altKey: true,
      action: () => router.push('/projects'),
      description: 'Go to Projects',
      category: 'Navigation'
    },
    {
      key: 't',
      altKey: true,
      action: () => router.push('/tasks'),
      description: 'Go to Tasks',
      category: 'Navigation'
    },
    {
      key: 'r',
      altKey: true,
      action: () => router.push('/reports'),
      description: 'Go to Reports',
      category: 'Navigation'
    },
    {
      key: 'i',
      altKey: true,
      action: () => router.push('/integrations'),
      description: 'Go to Integrations',
      category: 'Navigation'
    },
    {
      key: 'a',
      altKey: true,
      action: () => router.push('/analytics'),
      description: 'Go to Analytics',
      category: 'Navigation'
    },
    // Search shortcuts
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus search',
      category: 'Search'
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus search',
      category: 'Search'
    },
    // Quick actions
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        const newButton = document.querySelector('[data-new-button]') as HTMLButtonElement
        if (newButton) {
          newButton.click()
        }
      },
      description: 'Create new item',
      category: 'Actions'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement
        if (saveButton) {
          saveButton.click()
        }
      },
      description: 'Save current item',
      category: 'Actions'
    },
    // Help
    {
      key: '?',
      action: () => {
        const helpModal = document.querySelector('[data-help-modal]') as HTMLElement
        if (helpModal) {
          helpModal.click()
        }
      },
      description: 'Show keyboard shortcuts',
      category: 'Help'
    }
  ]

  useKeyboardShortcuts(shortcuts)

  return shortcuts
}

// Hook for showing keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const shortcuts = useGlobalKeyboardShortcuts()

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = []
    if (shortcut.ctrlKey) keys.push('Ctrl')
    if (shortcut.altKey) keys.push('Alt')
    if (shortcut.shiftKey) keys.push('Shift')
    if (shortcut.metaKey) keys.push('Cmd')
    keys.push(shortcut.key.toUpperCase())
    return keys.join(' + ')
  }

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  return {
    shortcuts,
    groupedShortcuts,
    formatShortcut
  }
}
