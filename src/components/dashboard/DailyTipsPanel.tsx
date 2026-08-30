'use client'

import { useState, useMemo, useCallback } from 'react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, RefreshCw, ChevronDown, ChevronRight, Quote, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ==================== TYPES ====================
type TipCategory =
 | 'Productivity'
 | 'Memory'
 | 'Focus'
 | 'Growth Mindset'
 | 'Study Techniques'

interface LearningTip {
 text: string
 category: TipCategory
 attribution: string
}

interface DailyTipsPanelProps {
 className?: string
}

// ==================== CATEGORY CONFIG ====================
const categoryConfig: Record<
 TipCategory,
 {
 bgGradient: string
 badgeClass: string
 borderAccent: string
 quoteColor: string
 }
> = {
 Productivity: {
 bgGradient: 'from-white/5 via-transparent to-transparent',
 badgeClass: 'bg-gray-100 text-gray-600 border-gray-300',
 borderAccent: 'border-l-gray-400',
 quoteColor: 'text-gray-300',
 },
 Memory: {
 bgGradient: 'from-white/5 via-transparent to-transparent',
 badgeClass: 'bg-gray-100 text-gray-600 border-gray-300',
 borderAccent: 'border-l-gray-400',
 quoteColor: 'text-gray-300',
 },
 Focus: {
 bgGradient: 'from-white/5 via-transparent to-transparent',
 badgeClass: 'bg-gray-100 text-gray-600 border-gray-300',
 borderAccent: 'border-l-gray-400',
 quoteColor: 'text-gray-300',
 },
 'Growth Mindset': {
 bgGradient: 'from-white/5 via-transparent to-transparent',
 badgeClass: 'bg-gray-100 text-gray-600 border-gray-300',
 borderAccent: 'border-l-gray-400',
 quoteColor: 'text-gray-300',
 },
 'Study Techniques': {
 bgGradient: 'from-white/5 via-transparent to-transparent',
 badgeClass: 'bg-gray-100 text-gray-600 border-gray-300',
 borderAccent: 'border-l-gray-400',
 quoteColor: 'text-gray-300',
 },
}

// ==================== CURATED TIPS DATABASE ====================
const tips: LearningTip[] = [
 // Productivity
 {
 text: 'The Feynman Technique: Try explaining a concept in simple terms as if teaching a child. If you cannot explain it simply, you do not understand it well enough.',
 category: 'Productivity',
 attribution: '— Based on cognitive science research',
 },
 {
 text: 'The Pomodoro Technique works because it leverages your brain\'s natural attention cycle. 25 minutes of focus followed by a 5-minute break optimizes cognitive performance.',
 category: 'Productivity',
 attribution: '— Francesco Cirillo, time management methodology',
 },
 {
 text: 'Batch similar tasks together. Context switching between different types of work can cost you up to 40% of your productive time. Group related activities into dedicated blocks.',
 category: 'Productivity',
 attribution: '— Based on attention residue research',
 },
 {
 text: 'The two-minute rule: if a learning task takes less than two minutes, do it immediately. Small wins build momentum and prevent task accumulation.',
 category: 'Productivity',
 attribution: '— David Allen, Getting Things Done',
 },
 {
 text: 'Apply the 80/20 rule to your learning. Focus on the 20% of concepts that deliver 80% of practical understanding before diving into edge cases and details.',
 category: 'Productivity',
 attribution: '— Pareto principle applied to learning',
 },

 // Memory
 {
 text: 'Spaced repetition beats cramming every time. Review material at increasing intervals (1 day, 3 days, 7 days, 14 days) for long-term retention.',
 category: 'Memory',
 attribution: '— Ebbinghaus forgetting curve research',
 },
 {
 text: 'Active recall is 2x more effective than re-reading. Close the book and try to remember what you just learned before looking back.',
 category: 'Memory',
 attribution: '— Roediger & Karpicke, 2006',
 },
 {
 text: 'Your brain consolidates memories during sleep. Studying before bed and getting 7-8 hours of sleep improves retention by up to 40%.',
 category: 'Memory',
 attribution: '— Walker & Stickgold, sleep research',
 },
 {
 text: 'Use the method of loci (memory palace) to remember lists and sequences. Associate items with familiar locations in a mental space for dramatic recall improvement.',
 category: 'Memory',
 attribution: '— Ancient mnemonic technique, validated by modern neuroscience',
 },
 {
 text: 'Interleaving different topics during study sessions strengthens neural pathways more than studying one subject at a time. Mix it up for deeper learning.',
 category: 'Memory',
 attribution: '— Rohrer et al., interleaving research',
 },

 // Focus
 {
 text: 'Deep work requires at least 90 minutes of uninterrupted concentration. Block distractions completely — even a brief interruption can take 23 minutes to recover from.',
 category: 'Focus',
 attribution: '— Cal Newport, Deep Work',
 },
 {
 text: 'Your environment shapes your focus more than willpower. Design your study space to minimize friction and remove temptation before it arises.',
 category: 'Focus',
 attribution: '— James Clear, Atomic Habits',
 },
 {
 text: 'Single-tasking is a superpower. The brain cannot truly multitask — it switches rapidly between tasks, degrading performance on all of them by up to 40%.',
 category: 'Focus',
 attribution: '— American Psychological Association research',
 },
 {
 text: 'The "flow state" occurs when challenge perfectly matches skill level. Adjust task difficulty to stay in this zone for peak learning and productivity.',
 category: 'Focus',
 attribution: '— Mihaly Csikszentmihalyi, flow theory',
 },

 // Growth Mindset
 {
 text: 'Teaching others is the most effective way to learn. When you explain a concept, you organize your knowledge and identify gaps in your understanding.',
 category: 'Growth Mindset',
 attribution: '— The protégé effect, cognitive psychology',
 },
 {
 text: 'Embrace productive struggle. The discomfort of not knowing is where real growth happens. If learning feels easy, you may not be challenging yourself enough.',
 category: 'Growth Mindset',
 attribution: '— Carol Dweck, mindset research',
 },
 {
 text: 'Your brain is not fixed — it physically changes with learning through neuroplasticity. Every new skill you practice rewires neural connections.',
 category: 'Growth Mindset',
 attribution: '— Neuroscience research on neuroplasticity',
 },
 {
 text: 'Reframe failures as data points. Each mistake tells you something specific about where to adjust your approach. Curiosity about failure accelerates growth.',
 category: 'Growth Mindset',
 attribution: '— Growth mindset framework',
 },

 // Study Techniques
 {
 text: 'Start with the big picture, then zoom in. Building a mental scaffold of the overall topic before filling in details creates stronger, more connected understanding.',
 category: 'Study Techniques',
 attribution: '— Advance organizer theory, Ausubel',
 },
 {
 text: 'Write notes in your own words rather than copying verbatim. The act of paraphrasing forces your brain to process and encode the information more deeply.',
 category: 'Study Techniques',
 attribution: '— Generative learning research',
 },
 {
 text: 'Use analogies to understand complex topics. Connecting unfamiliar concepts to familiar ones creates neural bridges that dramatically speed up comprehension.',
 category: 'Study Techniques',
 attribution: '— Analogical learning theory',
 },
 {
 text: 'Practice testing yourself is one of the most powerful study strategies. Even before you feel ready, quiz yourself — the struggle of retrieval strengthens memory.',
 category: 'Study Techniques',
 attribution: '— Testing effect, cognitive psychology',
 },
 {
 text: 'Break large learning goals into micro-skills. Instead of "learn JavaScript," aim for "understand array methods," "build a fetch request," and "debug an error." Small targets are less overwhelming.',
 category: 'Study Techniques',
 attribution: '— Scaffolding and chunking principles',
 },
 {
 text: 'Create concept maps to visualize relationships between ideas. Seeing how topics connect builds a richer mental model than studying isolated facts.',
 category: 'Study Techniques',
 attribution: '— Concept mapping research, Novak',
 },
]

// ==================== HELPER FUNCTIONS ====================

function getDateHash(dateOffset: number = 0): number {
 const date = new Date()
 date.setDate(date.getDate() - dateOffset)
 const dateString = date.toDateString()
 return dateString.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % tips.length
}

function getPreviousDateLabel(offset: number): string {
 if (offset === 1) return 'Yesterday'
 if (offset === 2) return '2 days ago'
 if (offset === 3) return '3 days ago'
 return `${offset} days ago`
}

// ==================== ANIMATION VARIANTS ====================

const containerVariants = {
 hidden: { opacity: 0, y: 20 },
 visible: {
 opacity: 1,
 y: 0,
 transition: { duration: 0.5, ease: 'easeOut' as const },
 },
}

const tipCardVariants = {
 hidden: { opacity: 0, y: 12 },
 visible: {
 opacity: 1,
 y: 0,
 transition: { duration: 0.4, ease: 'easeOut' as const },
 },
 exit: {
 opacity: 0,
 height: 0,
 marginTop: 0,
 marginBottom: 0,
 transition: { duration: 0.25, ease: 'easeIn' as const },
 },
}

const previousTipVariants = {
 hidden: { opacity: 0, x: -10 },
 visible: (i: number) => ({
 opacity: 1,
 x: 0,
 transition: { duration: 0.3, delay: 0.1 * i, ease: 'easeOut' as const },
 }),
}

// ==================== COMPONENT ====================

export function DailyTipsPanel(props: DailyTipsPanelProps) {
 const mounted = useIsMounted()
 if (!mounted) {
 return (
 <motion.div className={props.className}>
 <Card className="overflow-hidden">
 <CardHeader className="pb-2">
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
 <div className="h-5 w-32 rounded bg-muted animate-pulse" />
 </div>
 </CardHeader>
 <CardContent className="pt-0">
 <div className="h-28 rounded-lg bg-muted animate-pulse" />
 </CardContent>
 </Card>
 </motion.div>
 )
 }
 return <DailyTipsPanelInner {...props} />
}

function DailyTipsPanelInner({ className }: DailyTipsPanelProps) {
 const [manualOffset, setManualOffset] = useState(0)
 const [expandedPrevious, setExpandedPrevious] = useState<number | null>(null)

 const todayIndex = useMemo(() => getDateHash(0), [])
 const currentTipIndex = (todayIndex + manualOffset) % tips.length
 const currentTip = tips[currentTipIndex]
 const categoryStyle = categoryConfig[currentTip.category]

 const previousTips = useMemo(
 () => [1, 2, 3].map((offset) => {
 const index = getDateHash(offset)
 return { tip: tips[index], offset, label: getPreviousDateLabel(offset) }
 }),
 []
 )

 const handleRefresh = useCallback(() => {
 setManualOffset((prev) => (prev + 1) % tips.length)
 }, [])

 const togglePrevious = useCallback((offset: number) => {
 setExpandedPrevious((prev) => (prev === offset ? null : offset))
 }, [])

 return (
 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className={className}
 >
 <Card className="overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
 {/* Header */}
 <CardHeader className="pb-2">
 <div className="flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200">
 <Lightbulb className="h-4.5 w-4.5 text-gray-600" />
 </div>
 <CardTitle className="text-base">Daily Learning Tip</CardTitle>
 </div>
 <CardAction>
 <Badge
 variant="outline"
 className="gap-1.5 border-gray-300 bg-gray-100 text-gray-700"
 >
 <Brain className="h-3 w-3" />
 Today&apos;s Insight
 </Badge>
 </CardAction>
 </CardHeader>

 <CardContent className="flex flex-col gap-4 pt-0">
 {/* Main Tip Card */}
 <AnimatePresence mode="wait">
 <motion.div
 key={currentTipIndex}
 variants={tipCardVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 className={cn(
 'relative overflow-hidden rounded-lg border-l-4 p-4',
 categoryStyle.borderAccent
 )}
 >
 {/* Gradient background overlay */}
 <div
 className={cn(
 'pointer-events-none absolute inset-0 bg-gradient-to-br',
 categoryStyle.bgGradient
 )}
 />

 {/* Quote icon */}
 <Quote
 className={cn(
 'absolute right-3 top-2 h-12 w-12 opacity-40',
 categoryStyle.quoteColor
 )}
 />

 <div className="relative z-10 flex flex-col gap-3">
 {/* Category badge */}
 <Badge
 variant="outline"
 className={cn('w-fit text-[11px] font-medium', categoryStyle.badgeClass)}
 >
 {currentTip.category}
 </Badge>

 {/* Tip text */}
 <p className="text-sm leading-relaxed font-medium text-gray-700">
 {currentTip.text}
 </p>

 {/* Attribution */}
 <p className="text-xs text-gray-500 italic">
 {currentTip.attribution}
 </p>
 </div>
 </motion.div>
 </AnimatePresence>

 {/* Refresh button */}
 <div className="flex justify-center">
 <Button
 variant="ghost"
 size="sm"
 onClick={handleRefresh}
 className="gap-1.5 text-xs text-gray-500 hover:text-foreground"
 >
 <RefreshCw className="h-3.5 w-3.5" />
 Next tip
 </Button>
 </div>

 {/* Separator */}
 <div className="flex items-center gap-2">
 <div className="h-px flex-1 bg-border" />\n <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
 Previous
 </span>
 <div className="h-px flex-1 bg-border" />
 </div>

 {/* Previous Tips */}
 <div className="flex flex-col gap-2">
 {previousTips.map((item, i) => {
 const prevCategoryStyle = categoryConfig[item.tip.category]
 const isExpanded = expandedPrevious === item.offset

 return (
 <motion.div
 key={item.offset}
 custom={i}
 variants={previousTipVariants}
 initial="hidden"
 animate="visible"
 >
 <button
 onClick={() => togglePrevious(item.offset)}
 className={cn(
 'w-full rounded-lg border border-gray-200/60 bg-white/40 backdrop-blur-sm p-3 text-left transition-colors hover:bg-gray-50/60',
 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
 )}
 aria-expanded={isExpanded}
 >
 <div className="flex items-start gap-2">
 {isExpanded ? (
 <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
 ) : (
 <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
 )}
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="text-[11px] text-gray-500 whitespace-nowrap">
 {item.label}
 </span>
 <Badge
 variant="outline"
 className={cn(
 'text-[10px] px-1.5 py-0',
 prevCategoryStyle.badgeClass
 )}
 >
 {item.tip.category}
 </Badge>
 </div>
 <p className="mt-1 text-xs text-foreground/80 line-clamp-1">
 {item.tip.text}
 </p>
 </div>
 </div>

 {/* Expanded content */}
 <AnimatePresence>
 {isExpanded && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 transition={{ duration: 0.2, ease: 'easeInOut' }}
 className="overflow-hidden"
 >
 <div className="mt-2 ml-6 border-t border-border/50 pt-2">
 <p className="text-xs leading-relaxed text-foreground/90">
 {item.tip.text}
 </p>
 <p className="mt-1.5 text-[11px] text-gray-500 italic">
 {item.tip.attribution}
 </p>
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
