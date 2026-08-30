'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useAppStore } from '@/store'
import { LandingPage } from '@/components/landing/LandingPage'
import { AuthView } from '@/components/auth/AuthView'
import { OnboardingView } from '@/components/onboarding/OnboardingView'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { RoadmapView } from '@/components/roadmap/RoadmapView'
import { AssistantView } from '@/components/chat/AssistantView'
import { ProfileView } from '@/components/profile/ProfileView'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'
import { KeyboardShortcuts } from '@/components/layout/KeyboardShortcuts'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// External store for session restored status (avoids setState-in-effect lint error)
let sessionRestoredListeners: Array<() => void> = []
let sessionRestoredValue = false

function setSessionRestored(val: boolean) {
  sessionRestoredValue = val
  sessionRestoredListeners.forEach(l => l())
}

function subscribeSessionRestored(listener: () => void) {
  sessionRestoredListeners.push(listener)
  return () => {
    sessionRestoredListeners = sessionRestoredListeners.filter(l => l !== listener)
  }
}

function getSessionRestoredSnapshot() {
  return sessionRestoredValue
}

function getSessionRestoredServerSnapshot() {
  return false
}

function AppContent() {
  const { currentView, isAuthenticated, restoreSession, setView } = useAppStore()
  const isSessionRestored = useSyncExternalStore(
    subscribeSessionRestored,
    getSessionRestoredSnapshot,
    getSessionRestoredServerSnapshot,
  )
  const initDone = useRef(false)

  // Restore session from localStorage on mount
  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    const restored = restoreSession()
    if (restored) {
      const storedUser = JSON.parse(localStorage.getItem('sb_user') || '{}')
      // Check if user has a profile to decide which view to show
      fetch(`/api/profile?userId=${storedUser.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.profile) {
            setView('dashboard')
          } else {
            setView('onboarding')
          }
          setSessionRestored(true)
        })
        .catch(() => {
          setView('onboarding')
          setSessionRestored(true)
        })
    } else {
      setSessionRestored(true)
    }
  }, [])

  // Wait for session restoration before rendering
  if (!isSessionRestored) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-800 rounded-full" />
      </div>
    )
  }

  // Not authenticated: show landing or auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        {currentView === 'landing' && <LandingPage />}
        {currentView === 'auth' && <AuthView />}
        <AppFooter />
      </div>
    )
  }

  // Authenticated: show app shell
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <KeyboardShortcuts />
      <main className="flex-1">
        <ErrorBoundary>
          {currentView === 'onboarding' && <OnboardingView />}
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'roadmap' && <RoadmapView />}
          {currentView === 'assistant' && <AssistantView />}
          {currentView === 'profile' && <ProfileView />}
        </ErrorBoundary>
      </main>
      <AppFooter />
    </div>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
