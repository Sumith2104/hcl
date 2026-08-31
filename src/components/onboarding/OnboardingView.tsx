'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Send, Loader2, User, Brain, ArrowUp, Target, Code, BookOpen, CheckCircle2, Hand } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// Progress stepper stages
const STEPS = [
  { label: 'Welcome', icon: Sparkles },
  { label: 'Goals', icon: Target },
  { label: 'Skills', icon: Code },
  { label: 'Experience', icon: BookOpen },
  { label: 'Complete', icon: CheckCircle2 },
] as const

// Quick reply suggestions per step
const QUICK_REPLIES: Record<number, string[]> = {
  0: ['I want to become a Full-Stack Developer', 'Help me transition to tech', 'I want to learn AI/ML'],
  1: ['I can study 5-10 hours/week', 'I want to learn in 3 months', 'I prefer hands-on projects'],
  2: ['I know basic JavaScript', 'I have some Python experience', 'I\'m a complete beginner'],
  3: ['I have 1-2 years of experience', 'I\'m self-taught', 'I have a CS degree'],
  4: ['Sounds great, let\'s start!', 'Can you adjust my timeline?', 'Add more practice projects'],
}

// Dynamic placeholder text per step
const PLACEHOLDERS: Record<number, string> = {
  0: 'What would you like to learn?',
  1: 'Tell us about your learning goals...',
  2: 'What skills do you already have?',
  3: 'Describe your experience level...',
  4: 'Any final adjustments?',
}

export function OnboardingView() {
  const { user, addOnboardingMessage, onboardingMessages, setView, setProfile, onboardingStep } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [completionPercent, setCompletionPercent] = useState(0)
  const [roles, setRoles] = useState<string[]>([])
  const [profileComplete, setProfileComplete] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Show welcome animation for 1.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false)
      fetchRoles()
      if (onboardingMessages.length === 0) {
        handleSendMessage('')
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Smooth auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' as const })
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [onboardingMessages, loading, scrollToBottom])

  // Determine current step index (0-4) clamped
  const currentStepIndex = Math.min(Math.floor(onboardingStep / 2), 4)
  const placeholderText = PLACEHOLDERS[currentStepIndex] || 'Type your message...'
  const quickReplies = QUICK_REPLIES[currentStepIndex] || []

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/skills?roles=true')
      const data = await res.json()
      if (data.roles) {
        setRoles(data.roles)
      }
    } catch {
      // silently handle
    }
  }

  const handleSendMessage = async (msg: string) => {
    const message = msg || input.trim()
    if (!message && onboardingMessages.length > 0) return

    if (message) {
      addOnboardingMessage('user', message)
      setInput('')
    }

    setLoading(true)
    try {
      const history = onboardingMessages.map(m => ({ role: m.role, content: m.content }))
      if (message) history.push({ role: 'user', content: message })

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, message: message || 'Hello, I want to start learning.', history }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }

      addOnboardingMessage('assistant', data.reply)
      setCompletionPercent(Math.min(100, onboardingMessages.length * 15 + 10))

      if (data.profileComplete && data.profileData) {
        setProfile(data.profileData)
        setCompletionPercent(100)
        setProfileComplete(true)
        setTimeout(() => {
          toast.success('Profile created! Generating your roadmap...')
          generateRoadmap(data.profileData)
        }, 1500)
      }
    } catch {
      toast.error('Failed to get AI response')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const generateRoadmap = async (profileData: Record<string, unknown>) => {
    setGeneratingRoadmap(true)
    setGenStep(1)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120_000) // 2 min timeout
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, profile: profileData }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      setGenStep(2)
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        setGeneratingRoadmap(false)
        setView('dashboard')
        return
      }
      setGenStep(3)
      toast.success(`Roadmap ready! ${data.phasesCount} phases, ${data.skillsCount} skills, ${data.resourcesCount} resources`)
      setTimeout(() => setView('dashboard'), 800)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.error('Roadmap generation timed out. Please try again.')
      } else {
        toast.error('Failed to generate roadmap. Please try again.')
      }
      setGeneratingRoadmap(false)
      setView('dashboard')
    }
  }

  // Show role chips when the last message is from the assistant and
  // the user hasn't responded yet
  const lastMessage = onboardingMessages[onboardingMessages.length - 1]
  const userHasResponded = onboardingMessages.some(m => m.role === 'user')
  const showRoleChips =
    !loading &&
    !userHasResponded &&
    lastMessage?.role === 'assistant' &&
    roles.length > 0

  // Show quick replies after AI message when not loading and profile not complete
  const showQuickReplies =
    !loading &&
    !profileComplete &&
    lastMessage?.role === 'assistant' &&
    quickReplies.length > 0 &&
    !showRoleChips

  // ===================== WELCOME ANIMATION =====================
  if (showWelcome) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 hero-gradient-bg overflow-hidden relative">
        {/* Floating sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
              x: [0, (i % 2 === 0 ? 1 : -1) * (40 + i * 15)],
              y: [0, -30 - i * 10],
            }}
            transition={{
              duration: 1.4,
              delay: 0.1 * i,
              ease: 'easeOut' as const,
            }}
          >
            <Sparkles className="h-4 w-4 text-neutral-900" />
          </motion.div>
        ))}

        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.8, ease: 'easeOut' as const }}
        >
          {/* Logo icon */}
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-100 shadow-xl shadow-sm/30 mb-6"
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' as const, stiffness: 200 }}
          >
            <Sparkles className="h-10 w-10 text-white" />
          </motion.div>

          {/* Title text */}
          <motion.h1
            className="text-2xl sm:text-3xl font-bold mb-3 text-gradient-neutral"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' as const }}
          >
            Let&apos;s build your learning path
          </motion.h1>

          <motion.p
            className="text-muted-foreground text-sm sm:text-base max-w-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4, ease: 'easeOut' as const }}
          >
            AI-powered personalized learning, tailored just for you.
          </motion.p>

          {/* Loading dots */}
          <motion.div
            className="flex gap-1.5 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.3 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-neutral-100"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut' as const,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // ===================== ROADMAP GENERATING OVERLAY =====================
  if (generatingRoadmap) {
    const steps = [
      'Analyzing your profile...',
      'AI is designing your learning path...',
      'Matching the best free resources...',
      'Building your roadmap...',
      'Almost there!',
    ]
    const currentStepText = genStep >= 3 ? steps[4] : genStep >= 2 ? steps[2] : steps[1]
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 hero-gradient-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm flex flex-col items-center text-center"
        >
          <div className="relative mb-8">
            <div className="h-20 w-20 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center">
              <Brain className="h-10 w-10 text-gray-700" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-2xl border-2 border-gray-400/30"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Generating Your Roadmap</h2>
          <p className="text-sm text-gray-500 mb-8">{currentStepText}</p>
          <div className="w-full max-w-xs">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gray-800 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: genStep >= 3 ? '100%' : genStep >= 2 ? '70%' : '35%' }}
                transition={{ duration: 1.5, ease: 'easeOut' as const }}
              />
            </div>
            <div className="flex justify-between mt-3">
              {steps.slice(0, 4).map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-300 ${
                    (genStep >= 3 && i >= 2) || (genStep >= 2 && i >= 1) || (genStep >= 1 && i >= 0)
                      ? 'bg-gray-800 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {i < (genStep >= 3 ? 4 : genStep >= 2 ? 3 : 1) ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-gray-400 max-w-[60px] text-center leading-tight">{step.split('...')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ===================== COMPLETION SCREEN =====================
  if (profileComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 hero-gradient-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
          className="w-full max-w-md flex flex-col items-center text-center"
        >
          <svg viewBox="0 0 320 120" className="w-72 h-auto mb-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M40 80 Q80 80 100 55 Q120 30 160 50 Q200 70 220 40 Q240 20 280 40"
              stroke="url(#completionPathGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' as const }}
            />
            <defs>
              <linearGradient id="completionPathGrad" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#171717" />
                <stop offset="50%" stopColor="#737373" />
                <stop offset="100%" stopColor="#a3a3a3" />
              </linearGradient>
            </defs>
            <motion.circle cx="40" cy="80" r="12" fill="#171717"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4, type: 'spring' as const }}
            />
            <motion.path d="M34 80 L38 84 L47 75" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            />
            <motion.circle cx="120" cy="38" r="12" fill="#737373"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4, type: 'spring' as const }}
            />
            <motion.circle cx="120" cy="38" r="4" fill="white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.0, duration: 0.3 }}
            />
            <motion.circle cx="210" cy="45" r="12" fill="#404040"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4, type: 'spring' as const }}
            />
            <motion.circle cx="210" cy="45" r="4" fill="white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4, duration: 0.3 }}
            />
            <motion.circle cx="280" cy="40" r="14" fill="#a3a3a3" opacity="0.2"
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.1, 0.2] }}
              transition={{ delay: 1.5, duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
            />
            <motion.circle cx="280" cy="40" r="11" fill="#a3a3a3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.4, type: 'spring' as const }}
            />
            <motion.path d="M275 40 L278 43 L285 36" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.8, duration: 0.3 }}
            />
            <motion.text x="40" y="104" textAnchor="middle" fontSize="10" fill="oklch(0.556 0 0)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >Start</motion.text>
            <motion.text x="120" y="22" textAnchor="middle" fontSize="10" fill="oklch(0.556 0 0)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >Learn</motion.text>
            <motion.text x="210" y="70" textAnchor="middle" fontSize="10" fill="oklch(0.556 0 0)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >Practice</motion.text>
            <motion.text x="280" y="66" textAnchor="middle" fontSize="10" fontWeight="600" fill="oklch(0.145 0 0)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 }}
            >Master</motion.text>
          </svg>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-[3px] border-neutral-200 dark:border-neutral-200 border-t-neutral-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-neutral-900" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Creating your personalized roadmap...</h2>
              <p className="text-sm text-muted-foreground">Analyzing skill gaps and building your learning path</p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ===================== MAIN CHAT VIEW =====================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 hero-gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
        className="w-full max-w-2xl"
      >
        {/* Progress Stepper */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isActive = i === currentStepIndex
              const isCompleted = i < currentStepIndex
              return (
                <div key={step.label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                        isCompleted
                          ? 'bg-neutral-900 text-white shadow-md shadow-sm/25'
                          : isActive
                            ? 'bg-neutral-100 dark:bg-neutral-100/50 text-neutral-900 dark:text-neutral-900 ring-2 ring-neutral-300/30'
                            : 'bg-muted text-muted-foreground'
                      }`}
                      animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                      transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } : { duration: 0.3 }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </motion.div>
                    <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                      isActive ? 'text-neutral-900 dark:text-neutral-900' : isCompleted ? 'text-neutral-900 dark:text-neutral-900' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 mt-[-18px]">
                      <div className="h-[2px] bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-white border border-neutral-200 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                          transition={{ duration: 0.6, ease: 'easeOut' as const }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat Card */}
        <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/30 bg-white/70 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 shadow-md shadow-black/10">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">AI Learning Assistant</h2>
                  <p className="text-xs text-muted-foreground">Building your personalized path</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-700 border-neutral-200">
                {completionPercent}%
              </Badge>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="h-[400px] sm:h-[480px]" ref={scrollRef}>
            <div className="p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {onboardingMessages.map((msg, i) => {
                  const isUser = msg.role === 'user'
                  return (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{
                        duration: 0.35,
                        ease: 'easeOut' as const,
                        delay: 0.05 * Math.min(i, 5),
                      }}
                      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
                        isUser
                          ? 'bg-neutral-800'
                          : 'bg-neutral-800'
                      }`}>
                        {isUser ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Brain className="h-4 w-4 text-white" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-neutral-800 text-white shadow-md shadow-black/10'
                          : 'bg-white/60 backdrop-blur-md border border-white/40 border-l-[3px] border-l-neutral-400 shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  )
                })}

                {/* Typing indicator */}
                {loading && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3, ease: 'easeOut' as const }}
                    className="flex gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 shadow-sm">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/40 border-l-[3px] border-l-neutral-400 shadow-sm">
                      <div className="flex gap-2 items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-gray-300 typing-dot" />
                        <div className="h-2.5 w-2.5 rounded-full bg-gray-300 typing-dot" />
                        <div className="h-2.5 w-2.5 rounded-full bg-gray-300 typing-dot" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Reply Suggestions */}
              {showQuickReplies && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' as const }}
                  className="flex flex-wrap gap-2 pl-11"
                >
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSendMessage(reply)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/60 backdrop-blur-sm px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-white/80 hover:border-white/60 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md"
                    >
                      <Hand className="h-3 w-3" />
                      {reply}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Role Chips (shown only before first user response) */}
              {showRoleChips && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' as const }}
                  className="pl-11"
                >
                  <p className="text-xs text-muted-foreground mb-2">Quick pick a role:</p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleSendMessage(`I want to become a ${role}`)}
                        disabled={loading}
                        className="inline-flex items-center rounded-full border border-white/40 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white/80 hover:border-white/60 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Enhanced Input Area */}
          <div className="border-t border-white/30 bg-white/70 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={placeholderText}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage('')}
                  disabled={loading}
                  className="w-full h-12 rounded-full border border-white/40 bg-white/70 backdrop-blur-sm px-5 pr-14 text-sm outline-none focus:ring-2 focus:ring-neutral-300/30 focus:border-neutral-300 transition-all duration-200 placeholder:text-muted-foreground/70 disabled:opacity-50"
                />
                <Button
                  onClick={() => handleSendMessage('')}
                  disabled={loading || !input.trim()}
                  size="sm"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 shadow-md shadow-black/10 p-0 transition-all duration-200"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <motion.div
                      whileHover={{ x: 2, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.15, ease: 'easeOut' as const }}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </motion.div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
