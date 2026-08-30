'use client'

import { useEffect, useRef } from 'react'
import { useAppStore, type AppView } from '@/store'
import { toast } from 'sonner'

const SHORTCUT_MAP: Record<string, { view: AppView; label: string }> = {
  '1': { view: 'dashboard', label: 'Dashboard (⌘+1)' },
  '2': { view: 'roadmap', label: 'Roadmap (⌘+2)' },
  '3': { view: 'assistant', label: 'AI Assistant (⌘+3)' },
  '4': { view: 'profile', label: 'Profile (⌘+4)' },
}

export function KeyboardShortcuts() {
  const { isAuthenticated, setView } = useAppStore()
  const notifiedShortcuts = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      // Don't trigger when user is typing in an input/textarea/contenteditable
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable
      ) {
        return
      }

      const mod = e.metaKey || e.ctrlKey

      // Escape: prevent default (close any open dropdown/sheet)
      if (e.key === 'Escape') {
        e.preventDefault()
        return
      }

      if (!mod) return

      const key = e.key

      // Ctrl+K / Cmd+K → Navigate to AI Assistant
      if (key === 'k') {
        e.preventDefault()
        setView('assistant')
        if (!notifiedShortcuts.current.has('k')) {
          notifiedShortcuts.current.add('k')
          toast.info('AI Assistant (⌘+K)')
        }
        return
      }

      // Ctrl+1-4 / Cmd+1-4 → Navigate views
      const mapped = SHORTCUT_MAP[key]
      if (mapped) {
        e.preventDefault()
        setView(mapped.view)
        if (!notifiedShortcuts.current.has(key)) {
          notifiedShortcuts.current.add(key)
          toast.info(mapped.label)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthenticated, setView])

  return null
}
