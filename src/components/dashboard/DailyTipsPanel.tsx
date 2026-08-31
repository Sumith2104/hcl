'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, RefreshCw, ChevronDown, ChevronRight, Quote, Brain, Zap, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

type TipCategory = 'Productivity' | 'Memory' | 'Focus' | 'Growth Mindset' | 'Study Techniques'

interface LearningTip {
  text: string
  category: TipCategory
  attribution: string
  isPersonalized?: boolean
  relevanceContext?: string
}

interface DailyTipsPanelProps { className?: string }

const categoryConfig: Record<TipCategory, { bgGradient: string; badgeClass: string; borderAccent: string; quoteColor: string }> = {
  Productivity: { bgGradient: 'from-white/5 via-transparent to-transparent', badgeClass: 'bg-gray-100 text-gray-600 border-gray-300', borderAccent: 'border-l-gray-400', quoteColor: 'text-gray-300' },
  Memory: { bgGradient: 'from-white/5 via-transparent to-transparent', badgeClass: 'bg-gray-100 text-gray-600 border-gray-300', borderAccent: 'border-l-gray-400', quoteColor: 'text-gray-300' },
  Focus: { bgGradient: 'from-white/5 via-transparent to-transparent', badgeClass: 'bg-gray-100 text-gray-600 border-gray-300', borderAccent: 'border-l-gray-400', quoteColor: 'text-gray-300' },
  'Growth Mindset': { bgGradient: 'from-white/5 via-transparent to-transparent', badgeClass: 'bg-gray-100 text-gray-600 border-gray-300', borderAccent: 'border-l-gray-400', quoteColor: 'text-gray-300' },
  'Study Techniques': { bgGradient: 'from-white/5 via-transparent to-transparent', badgeClass: 'bg-gray-100 text-gray-600 border-gray-300', borderAccent: 'border-l-gray-400', quoteColor: 'text-gray-300' },
}

const fallbackTips: LearningTip[] = [
  { text: 'The Feynman Technique: Try explaining a concept in simple terms as if teaching a child. If you cannot explain it simply, you do not understand it well enough.', category: 'Productivity', attribution: '-- Based on cognitive science research' },
  { text: 'Spaced repetition beats cramming every time. Review material at increasing intervals (1 day, 3 days, 7 days, 14 days) for long-term retention.', category: 'Memory', attribution: '-- Ebbinghaus forgetting curve research' },
  { text: 'Active recall is 2x more effective than re-reading. Close the book and try to remember what you just learned before looking back.', category: 'Memory', attribution: '-- Roediger & Karpicke, 2006' },
  { text: 'Deep work requires at least 90 minutes of uninterrupted concentration. Block distractions completely.', category: 'Focus', attribution: '-- Cal Newport, Deep Work' },
  { text: 'Your brain consolidates memories during sleep. Studying before bed and getting 7-8 hours of sleep improves retention by up to 40%.', category: 'Memory', attribution: '-- Walker & Stickgold, sleep research' },
  { text: 'Start with the big picture, then zoom in. Building a mental scaffold before filling in details creates stronger understanding.', category: 'Study Techniques', attribution: '-- Advance organizer theory, Ausubel' },
  { text: 'Embrace productive struggle. The discomfort of not knowing is where real growth happens.', category: 'Growth Mindset', attribution: '-- Carol Dweck, mindset research' },
]

function getDateHash(dateOffset: number = 0): number {
  const date = new Date()
  date.setDate(date.getDate() - dateOffset)
  return date.toDateString().split('').reduce((a, c) => a + c.charCodeAt(0), 0) % fallbackTips.length
}

function getPreviousDateLabel(offset: number): string {
  if (offset === 1) return 'Yesterday'
  if (offset === 2) return '2 days ago'
  if (offset === 3) return '3 days ago'
  return `${offset} days ago`
}

const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } } }
const tipCardVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }, exit: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.25, ease: 'easeIn' as const } } }
const previousTipVariants = { hidden: { opacity: 0, x: -10 }, visible: (i: number) => ({ opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 * i, ease: 'easeOut' as const } }) }

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-border/50 p-3">
          <div className="flex items-center gap-2"><div className="h-4 w-28 bg-muted animate-pulse" /><div className="h-5 w-16 rounded-full bg-muted animate-pulse" /></div>
          <div className="h-3 w-44 bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function DailyTipsPanel(props: DailyTipsPanelProps) {
  const mounted = useIsMounted()
  if (!mounted) {
    return (
      <motion.div className={props.className}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-muted animate-pulse" /><div className="h-5 w-32 rounded bg-muted animate-pulse" /></div></CardHeader>
          <CardContent className="pt-0"><div className="h-28 rounded-lg bg-muted animate-pulse" /></CardContent>
        </Card>
      </motion.div>
    )
  }
  return <DailyTipsPanelInner {...props} />
}

function DailyTipsPanelInner({ className }: DailyTipsPanelProps) {
  const { user, profile, roadmap } = useAppStore()
  const [currentTip, setCurrentTip] = useState<LearningTip | null>(null)
  const [loading, setLoading] = useState(true)
  const [manualOffset, setManualOffset] = useState(0)
  const [expandedPrevious, setExpandedPrevious] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function fetchMLTip() {
      try {
        const res = await fetch('/api/ml/tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user!.id, goal: profile?.targetGoal, learningStyle: profile?.preferredLearningStyle }),
        })
        const data = await res.json()
        if (!cancelled && data.tip) setCurrentTip(data.tip)
      } catch { /* fallback */ } finally { if (!cancelled) setLoading(false) }
    }
    fetchMLTip()
    return () => { cancelled = true }
  }, [user, profile])

  const displayTip = currentTip || fallbackTips[getDateHash(0)]
  const categoryStyle = categoryConfig[displayTip.category]
  const previousTips = useMemo(() => [1, 2, 3].map((offset) => ({ tip: fallbackTips[getDateHash(offset)], offset, label: getPreviousDateLabel(offset) })), [])

  const handleRefresh = useCallback(() => {
    setManualOffset((prev) => (prev + 1) % fallbackTips.length)
    if (user) {
      fetch('/api/ml/tips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user!.id, goal: profile?.targetGoal }) })
        .then(r => r.json()).then(data => { if (data.tip) setCurrentTip(data.tip) }).catch(() => {})
    }
  }, [user, profile])

  const togglePrevious = useCallback((offset: number) => { setExpandedPrevious((prev) => (prev === offset ? null : offset)) }, [])
  const tipKey = currentTip ? `ml-${currentTip.text.substring(0, 20)}` : `fallback-${getDateHash(0)}`

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={className}>
      <Card className="overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200"><Lightbulb className="h-4.5 w-4.5 text-gray-600" /></div>
            <CardTitle className="text-base">Daily Learning Tip</CardTitle>
          </div>
          <CardAction>
            <Badge variant="outline" className="gap-1.5 border-gray-300 bg-gray-50 text-gray-700">
              {displayTip.isPersonalized ? <Zap className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
              {displayTip.isPersonalized ? 'AI-Personalized' : "Today's Insight"}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Generating personalized tip...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={tipKey + manualOffset} variants={tipCardVariants} initial="hidden" animate="visible" exit="exit" className={cn('relative overflow-hidden rounded-lg border-l-4 p-4', categoryStyle.borderAccent)}>
                <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', categoryStyle.bgGradient)} />
                <Quote className={cn('absolute right-3 top-2 h-12 w-12 opacity-40', categoryStyle.quoteColor)} />
                <div className="relative z-10 flex flex-col gap-3">
                  <Badge variant="outline" className={cn('w-fit text-[11px] font-medium', categoryStyle.badgeClass)}>{displayTip.category}</Badge>
                  <p className="text-sm leading-relaxed font-medium text-gray-700">{displayTip.text}</p>
                  {displayTip.isPersonalized && displayTip.relevanceContext && (
                    <p className="text-xs text-gray-500 italic">Why now: {displayTip.relevanceContext}</p>
                  )}
                  <p className="text-xs text-gray-500 italic">{displayTip.attribution}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-1.5 text-xs text-gray-500 hover:text-foreground">
              <RefreshCw className="h-3.5 w-3.5" /> Next tip
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Previous</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-2">
            {previousTips.map((item, i) => {
              const prevCategoryStyle = categoryConfig[item.tip.category]
              const isExpanded = expandedPrevious === item.offset
              return (
                <motion.div key={item.offset} custom={i} variants={previousTipVariants} initial="hidden" animate="visible">
                  <button onClick={() => togglePrevious(item.offset)} className={cn('w-full rounded-lg border border-gray-200/60 bg-white/40 backdrop-blur-sm p-3 text-left transition-colors hover:bg-gray-50/60', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50')} aria-expanded={isExpanded}>
                    <div className="flex items-start gap-2">
                      {isExpanded ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 whitespace-nowrap">{item.label}</span>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', prevCategoryStyle.badgeClass)}>{item.tip.category}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80 line-clamp-1">{item.tip.text}</p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }} className="overflow-hidden">
                          <div className="mt-2 ml-6 border-t border-border/50 pt-2">
                            <p className="text-xs leading-relaxed text-foreground/90">{item.tip.text}</p>
                            <p className="mt-1.5 text-[11px] text-gray-500 italic">{item.tip.attribution}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
