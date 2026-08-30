'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
 Tooltip,
 TooltipTrigger,
 TooltipContent,
} from '@/components/ui/tooltip'
import {
 Brain,
 RotateCcw,
 ChevronLeft,
 ChevronRight,
 Sparkles,
 CheckCircle2,
 XCircle,
 Clock,
 Star,
 Layers,
 BookOpen,
 Shuffle,
 Filter,
 Search,
 ArrowRight,
 Trophy,
 Target,
 Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ==================== TYPES ====================

type Difficulty = 'easy' | 'medium' | 'hard'
type Category =
 | 'React'
 | 'TypeScript'
 | 'CSS'
 | 'System Design'
 | 'Data Structures'
 | 'Algorithms'
type Rating = 'again' | 'hard' | 'good' | 'easy'
type StudyMode = 'flashcard' | 'quiz' | 'deck'

type FlashcardDef = {
 id: string
 question: string
 answer: string
 difficulty: Difficulty
 category: Category
 tags: string[]
}

type CardState = {
 interval: number
 easeFactor: number
 nextReview: number // timestamp
 reps: number
 lastRating?: Rating
}

type Flashcard = FlashcardDef & CardState

type SessionStats = {
 cardsStudied: number
 correct: number
 total: number
 startTime: number
}

// ==================== CONSTANTS ====================

const CATEGORIES: Category[] = [
 'React',
 'TypeScript',
 'CSS',
 'System Design',
 'Data Structures',
 'Algorithms',
]

const CATEGORY_COLORS: Record<
 Category,
 { bg: string; text: string; dot: string; border: string }
> = {
 React: {
 bg: 'bg-neutral-100 dark:bg-neutral-800',
 text: 'text-neutral-700 dark:text-neutral-300',
 dot: 'bg-neutral-100',
 border: 'border-neutral-200 dark:border-neutral-700',
 },
 TypeScript: {
 bg: 'bg-neutral-100 dark:bg-neutral-100',
 text: 'text-neutral-700 dark:text-neutral-700',
 dot: 'bg-neutral-100',
 border: 'border-neutral-200 dark:border-neutral-200',
 },
 CSS: {
 bg: 'bg-neutral-100 dark:bg-neutral-100',
 text: 'text-neutral-700 dark:text-neutral-700',
 dot: 'bg-neutral-100',
 border: 'border-neutral-200 dark:border-neutral-200',
 },
 'System Design': {
 bg: 'bg-neutral-100 dark:bg-neutral-100',
 text: 'text-neutral-700 dark:text-neutral-700',
 dot: 'bg-neutral-100',
 border: 'border-neutral-200 dark:border-neutral-200',
 },
 'Data Structures': {
 bg: 'bg-neutral-100 dark:bg-neutral-100',
 text: 'text-neutral-700 dark:text-neutral-700',
 dot: 'bg-neutral-100',
 border: 'border-neutral-200 dark:border-neutral-200',
 },
 Algorithms: {
 bg: 'bg-neutral-100 dark:bg-neutral-100',
 text: 'text-neutral-900 dark:text-neutral-900',
 dot: 'bg-neutral-100',
 border: 'border-neutral-200 dark:border-neutral-200',
 },
}

const DIFFICULTY_CONFIG: Record<
 Difficulty,
 { label: string; color: string; stars: number }
> = {
 easy: { label: 'Easy', color: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900', stars: 1 },
 medium: { label: 'Medium', color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-100 dark:text-neutral-700', stars: 2 },
 hard: { label: 'Hard', color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-100 dark:text-neutral-700', stars: 3 },
}

const RATING_CONFIG: Record<
 Rating,
 { label: string; color: string; hoverColor: string; icon: typeof RotateCcw }
> = {
 again: {
 label: 'Again',
 color: 'bg-neutral-100 hover:bg-neutral-100 text-white',
 hoverColor: 'hover:bg-neutral-100',
 icon: RotateCcw,
 },
 hard: {
 label: 'Hard',
 color: 'bg-neutral-100 hover:bg-neutral-100 text-white',
 hoverColor: 'hover:bg-neutral-100',
 icon: XCircle,
 },
 good: {
 label: 'Good',
 color: 'bg-neutral-900 text-white hover:bg-neutral-800',
 hoverColor: 'hover:bg-neutral-100',
 icon: CheckCircle2,
 },
 easy: {
 label: 'Easy',
 color: 'bg-neutral-900 text-white hover:bg-neutral-800',
 hoverColor: 'hover:bg-neutral-100',
 icon: Sparkles,
 },
}

const INITIAL_CARD_STATE: CardState = {
 interval: 0,
 easeFactor: 2.5,
 nextReview: 0,
 reps: 0,
}

// ==================== HELPERS ====================

function applySM2(
 currentState: CardState,
 rating: Rating
): CardState {
 const { interval, easeFactor, reps } = currentState
 let newInterval: number
 let newEase = easeFactor

 if (reps === 0) {
 // First review
 newInterval = rating === 'again' ? 0.4 : 1
 } else {
 switch (rating) {
 case 'again':
 newInterval = interval * 1.1
 newEase = easeFactor - 0.15
 break
 case 'hard':
 newInterval = interval * 1.3
 newEase = easeFactor - 0.05
 break
 case 'good':
 newInterval = interval * 2.0
 break
 case 'easy':
 newInterval = interval * 2.5
 newEase = easeFactor + 0.1
 break
 }
 }

 // Clamp ease factor between 1.2 and 2.5
 newEase = Math.min(2.5, Math.max(1.2, newEase))
 // Ensure minimum interval
 newInterval = Math.max(0.4, newInterval)

 const now = Date.now()
 return {
 interval: newInterval,
 easeFactor: newEase,
 nextReview: now + newInterval * 24 * 60 * 60 * 1000, // interval in days
 reps: reps + 1,
 lastRating: rating,
 }
}

function formatDate(timestamp: number): string {
 if (timestamp === 0) return 'Now'
 const now = Date.now()
 const diff = timestamp - now
 if (diff <= 0) return 'Due now'
 const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
 if (days === 1) return 'Tomorrow'
 if (days < 7) return `In ${days}d`
 if (days < 30) return `In ${Math.floor(days / 7)}w`
 return `In ${Math.floor(days / 30)}mo`
}

function isDue(card: Flashcard): boolean {
 return card.nextReview === 0 || card.nextReview <= Date.now()
}

function getMasteryScore(card: Flashcard): number {
 if (card.reps === 0) return 0
 // Mastery based on interval (longer interval = better mastery)
 const intervalScore = Math.min(card.interval / 30, 1) * 50 // max 50 from interval
 const repsScore = Math.min(card.reps / 10, 1) * 30 // max 30 from reps
 const easeScore = ((card.easeFactor - 1.2) / 1.3) * 20 // max 20 from ease
 return Math.min(100, intervalScore + repsScore + easeScore)
}

function generateQuizOptions(
 correctAnswer: string,
 allCards: FlashcardDef[]
): string[] {
 const otherAnswers = allCards
 .filter((c) => c.answer !== correctAnswer)
 .map((c) => c.answer)
 .sort(() => Math.random() - 0.5)
 .slice(0, 3)
 const options = [correctAnswer, ...otherAnswers]
 // Shuffle
 for (let i = options.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1))
 ;[options[i], options[j]] = [options[j], options[i]]
 }
 return options
}

// ==================== SUB-COMPONENTS ====================

function DifficultyStars({ difficulty }: { difficulty: Difficulty }) {
 const { stars } = DIFFICULTY_CONFIG[difficulty]
 return (
 <div className="flex items-center gap-0.5">
 {Array.from({ length: 3 }).map((_, i) => (
 <Star
 key={i}
 className={`size-3 ${
 i < stars
 ? 'fill-neutral-400 text-neutral-700'
 : 'fill-transparent text-muted-foreground/30'
 }`}
 />
 ))}
 </div>
 )
}

function FlipCard({
 card,
 isFlipped,
 onFlip,
 showRating,
 onRate,
 studyMode,
 quizOptions,
 selectedOption,
 onQuizSelect,
}: {
 card: Flashcard
 isFlipped: boolean
 onFlip: () => void
 showRating: boolean
 onRate: (rating: Rating) => void
 studyMode: 'flashcard' | 'quiz'
 quizOptions?: string[]
 selectedOption?: number | null
 onQuizSelect?: (idx: number) => void
}) {
 const isQuizCorrect =
 studyMode === 'quiz' &&
 selectedOption !== null &&
 quizOptions &&
 quizOptions[selectedOption] === card.answer

 return (
 <div
 className="relative w-full cursor-pointer"
 style={{ perspective: '1200px' }}
 onClick={studyMode === 'flashcard' ? onFlip : undefined}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => {
 if (e.key === ' ' && studyMode === 'flashcard') {
 e.preventDefault()
 onFlip()
 }
 }}
 >
 <motion.div
 className="relative w-full"
 style={{ transformStyle: 'preserve-3d' }}
 animate={{ rotateY: isFlipped ? 180 : 0 }}
 transition={{ duration: 0.6, ease: 'easeInOut' as const }}
 >
 {/* FRONT FACE */}
 <div
 className="w-full rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-sm p-6 shadow-sm"
 style={{ backfaceVisibility: 'hidden' }}
 >
 <div className="mb-4 flex items-center justify-between">
 <Badge
 variant="secondary"
 className={`${CATEGORY_COLORS[card.category].bg} ${CATEGORY_COLORS[card.category].text} border-0 font-medium`}
 >
 <span
 className={`mr-1.5 inline-block size-2 rounded-full ${CATEGORY_COLORS[card.category].dot}`}
 />
 {card.category}
 </Badge>
 <DifficultyStars difficulty={card.difficulty} />
 </div>

 <div className="mb-4 flex min-h-[140px] items-center">
 <p className="text-base font-medium leading-relaxed text-foreground md:text-lg">
 {card.question}
 </p>
 </div>

 {studyMode === 'flashcard' && (
 <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
 <Sparkles className="size-4" />
 <span>Click or press Space to reveal</span>
 </div>
 )}

 {studyMode === 'quiz' && quizOptions && (
 <div className="space-y-2 mt-2">
 {quizOptions.map((option, idx) => {
 const isCorrect = option === card.answer
 const isSelected = selectedOption === idx
 const isRevealed = selectedOption !== null
 let optClass =
 'border-border/60 bg-background/50 hover:border-gray-200/60 hover:bg-gray-50/80'
 if (isRevealed) {
 if (isCorrect)
 optClass =
 'border-gray-300 bg-gray-50'
 else if (isSelected && !isCorrect)
 optClass =
 'border-gray-300 bg-gray-50'
 else
 optClass = 'opacity-50'
 }
 return (
 <button
 key={idx}
 type="button"
 disabled={isRevealed}
 className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${optClass}`}
 onClick={(e) => {
 e.stopPropagation()
 onQuizSelect?.(idx)
 }}
 >
 <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-muted text-xs font-bold">
 {idx + 1}
 </span>
 <span className="line-clamp-2 align-middle">
 {option.length > 120
 ? option.substring(0, 120) + '...'
 : option}
 </span>
 </button>
 )
 })}
 </div>
 )}
 </div>

 {/* BACK FACE */}
 <div
 className="absolute inset-0 w-full rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-sm p-6 shadow-sm"
 style={{
 backfaceVisibility: 'hidden',
 transform: 'rotateY(180deg)',
 }}
 >
 <div className="mb-4 flex items-center justify-between">
 <Badge className="border-0 bg-gray-100 text-gray-600 font-medium">
 Answer
 </Badge>
 <Badge className="border-0 bg-gray-100 text-gray-600 font-medium">
 {card.category}
 </Badge>
 </div>

 <div className="mb-4 flex min-h-[140px] items-center">
 <p className="text-sm leading-relaxed text-foreground md:text-base">
 {card.answer}
 </p>
 </div>

 <div className="flex flex-wrap gap-1.5">
 {card.tags.map((tag) => (
 <span
 key={tag}
 className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/90"
 >
 #{tag}
 </span>
 ))}
 </div>
 </div>
 </motion.div>

 {/* Rating buttons (flashcard mode, shown after flip) */}
 <AnimatePresence>
 {showRating && studyMode === 'flashcard' && (
 <motion.div
 className="mt-4 grid grid-cols-4 gap-2"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 10 }}
 transition={{ duration: 0.3, ease: 'easeOut' as const }}
 >
 {(Object.keys(RATING_CONFIG) as Rating[]).map((rating, idx) => {
 const config = RATING_CONFIG[rating]
 const Icon = config.icon
 return (
 <Tooltip key={rating}>
 <TooltipTrigger asChild>
 <Button
 size="sm"
 className={`gap-1.5 text-xs font-medium ${config.color}`}
 onClick={(e) => {
 e.stopPropagation()
 onRate(rating)
 }}
 >
 <Icon className="size-3.5" />
 <span className="hidden sm:inline">
 {config.label}
 </span>
 <kbd className="ml-0.5 rounded bg-black/20 px-1 py-0.5 text-[10px]">
 {idx + 1}
 </kbd>
 </Button>
 </TooltipTrigger>
 <TooltipContent side="bottom">
 <p>Rate: {config.label} (press {idx + 1})</p>
 </TooltipContent>
 </Tooltip>
 )
 })}
 </motion.div>
 )}
 </AnimatePresence>

 {/* Quiz result rating */}
 <AnimatePresence>
 {showRating && studyMode === 'quiz' && selectedOption !== null && (
 <motion.div
 className="mt-4"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 10 }}
 transition={{ duration: 0.3, ease: 'easeOut' as const }}
 >
 <div
 className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
 isQuizCorrect
 ? 'bg-gray-100 text-gray-800'
 : 'bg-gray-100 text-gray-600'
 }`}
 >
 {isQuizCorrect ? (
 <>
 <CheckCircle2 className="size-5" />
 <span className="font-medium">Correct!</span>
 </>
 ) : (
 <>
 <XCircle className="size-5" />
 <span className="font-medium">Not quite.</span>
 </>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )
}

function CategoryMasteryBar({
 category,
 cards,
}: {
 category: Category
 cards: Flashcard[]
}) {
 const catCards = cards.filter((c) => c.category === category)
 if (catCards.length === 0) return null
 const avgMastery =
 catCards.reduce((sum, c) => sum + getMasteryScore(c), 0) / catCards.length
 const dueCount = catCards.filter(isDue).length
 const colors = CATEGORY_COLORS[category]

 return (
 <div className="flex items-center gap-3">
 <span
 className={`inline-block size-2.5 shrink-0 rounded-full ${colors.dot}`}
 />
 <div className="min-w-0 flex-1">
 <div className="mb-1 flex items-center justify-between text-xs">
 <span className="font-medium text-foreground truncate">
 {category}
 </span>
 <span className="text-gray-500 shrink-0 ml-2">
 {Math.round(avgMastery)}%
 {dueCount > 0 && (
 <span className="ml-1.5 text-neutral-700">({dueCount} due)</span>
 )}
 </span>
 </div>
 <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
 <motion.div
 className={`h-full rounded-full ${
 avgMastery >= 70
 ? 'bg-neutral-100'
 : avgMastery >= 40
 ? 'bg-neutral-100'
 : 'bg-neutral-100'
 }`}
 initial={{ width: 0 }}
 animate={{ width: `${avgMastery}%` }}
 transition={{ duration: 0.8, ease: 'easeOut' as const }}
 />
 </div>
 </div>
 </div>
 )
}

// ==================== DECK VIEW ====================

function DeckView({
 cards,
 onStartStudy,
}: {
 cards: Flashcard[]
 onStartStudy: () => void
}) {
 const [search, setSearch] = useState('')
 const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
 const [difficultyFilter, setDifficultyFilter] = useState<
 Difficulty | 'all'
 >('all')
 const [sortBy, setSortBy] = useState<
 'due' | 'difficulty' | 'category' | 'interval'
 >('due')

 const filtered = useMemo(() => {
 let result = [...cards]
 if (search) {
 const q = search.toLowerCase()
 result = result.filter(
 (c) =>
 (c.question || '').toLowerCase().includes(q) ||
 (c.answer || '').toLowerCase().includes(q) ||
 (c.tags || []).some((t: string) => (t || '').toLowerCase().includes(q))
 )
 }
 if (categoryFilter !== 'all') {
 result = result.filter((c) => c.category === categoryFilter)
 }
 if (difficultyFilter !== 'all') {
 result = result.filter((c) => c.difficulty === difficultyFilter)
 }
 switch (sortBy) {
 case 'due':
 result.sort((a, b) => a.nextReview - b.nextReview)
 break
 case 'difficulty': {
 const order: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 }
 result.sort((a, b) => order[a.difficulty] - order[b.difficulty])
 break
 }
 case 'category':
 result.sort((a, b) => a.category.localeCompare(b.category))
 break
 case 'interval':
 result.sort((a, b) => a.interval - b.interval)
 break
 }
 return result
 }, [cards, search, categoryFilter, difficultyFilter, sortBy])

 const dueTodayCount = cards.filter(isDue).length

 return (
 <div className="space-y-4">
 {/* Search + Filters Row */}
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
 <Input
 placeholder="Search cards..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="pl-9 bg-background/50 backdrop-blur"
 />
 </div>
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1 text-xs text-gray-500">
 <Filter className="size-3.5" />
 </div>
 <select
 value={categoryFilter}
 onChange={(e) =>
 setCategoryFilter(e.target.value as Category | 'all')
 }
 className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-300/30"
 >
 <option value="all">All Categories</option>
 {CATEGORIES.map((cat) => (
 <option key={cat} value={cat}>
 {cat}
 </option>
 ))}
 </select>
 <select
 value={difficultyFilter}
 onChange={(e) =>
 setDifficultyFilter(e.target.value as Difficulty | 'all')
 }
 className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-300/30"
 >
 <option value="all">All Levels</option>
 <option value="easy">Easy</option>
 <option value="medium">Medium</option>
 <option value="hard">Hard</option>
 </select>
 <select
 value={sortBy}
 onChange={(e) =>
 setSortBy(
 e.target.value as 'due' | 'difficulty' | 'category' | 'interval'
 )
 }
 className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-300/30"
 >
 <option value="due">Sort: Due Date</option>
 <option value="difficulty">Sort: Difficulty</option>
 <option value="category">Sort: Category</option>
 <option value="interval">Sort: Interval</option>
 </select>
 </div>
 </div>

 {/* Start Study CTA */}
 {dueTodayCount > 0 && (
 <motion.div
 initial={{ opacity: 0, y: -5 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3, ease: 'easeOut' as const }}
 >
 <Button
 onClick={onStartStudy}
 className="w-full gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
 >
 <Brain className="size-4" />
 Study {dueTodayCount} Due Card{dueTodayCount !== 1 ? 's' : ''}
 <ArrowRight className="size-4" />
 </Button>
 </motion.div>
 )}

 {/* Cards Grid */}
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <AnimatePresence mode="popLayout">
 {filtered.map((card) => {
 const mastery = getMasteryScore(card)
 const due = isDue(card)
 const colors = CATEGORY_COLORS[card.category]
 return (
 <motion.div
 key={card.id}
 layout
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.25, ease: 'easeOut' as const }}
 className={`group rounded-xl border p-4 transition-all hover:shadow-md ${
 due
 ? `${colors.border} bg-gradient-to-br from-white/60 to-white/30 dark:from-white/5 dark:to-white/20`
 : 'border-border/50 bg-background/50'
 } backdrop-blur-sm`}
 >
 <div className="mb-2 flex items-center justify-between">
 <Badge
 variant="secondary"
 className={`text-[10px] ${colors.bg} ${colors.text} border-0`}
 >
 {card.category}
 </Badge>
 {due && (
 <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-900 dark:text-neutral-900">
 <Clock className="size-3" />
 Due
 </span>
 )}
 </div>
 <p className="mb-2 line-clamp-2 text-xs font-medium text-foreground">
 {card.question}
 </p>
 <div className="mb-2 flex items-center gap-2">
 <DifficultyStars difficulty={card.difficulty} />
 <span className="ml-auto text-[10px] text-gray-500">
 {formatDate(card.nextReview)}
 </span>
 </div>
 <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
 <div
 className={`h-full rounded-full transition-all ${
 mastery >= 70
 ? 'bg-neutral-100'
 : mastery >= 40
 ? 'bg-neutral-100'
 : 'bg-neutral-100'
 }`}
 style={{ width: `${mastery}%` }}
 />
 </div>
 </motion.div>
 )
 })}
 </AnimatePresence>
 </div>

 {filtered.length === 0 && (
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <Layers className="mb-3 size-10 text-gray-300" />
 <p className="text-sm font-medium text-gray-500">
 No cards match your filters
 </p>
 <p className="mt-1 text-xs text-gray-400/70">
 Try adjusting your search or filters
 </p>
 </div>
 )}
 </div>
 )
}

// ==================== MAIN COMPONENT ====================

export function FlashcardStudyTool({ className }: { className?: string }) {
 const { user } = useAppStore()
 const isMounted = useIsMounted()

 // Card states
 const [cards, setCards] = useState<Flashcard[]>([])
 const [flashcardDefs, setFlashcardDefs] = useState<FlashcardDef[]>([])
 const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(true)

 // Fetch flashcards from API
 useEffect(() => {
 if (!isMounted || !user) return
 setIsLoadingFlashcards(true)
 fetch(`/api/flashcards?userId=${user.id}`)
 .then(r => r.json())
 .then(data => {
 const defs: FlashcardDef[] = (data.flashcards || []).map((f: Record<string, unknown>) => ({
 id: f.id as string,
 question: f.question as string,
 answer: f.answer as string,
 difficulty: (f.difficulty as Difficulty) || 'medium',
 category: (f.category as Category) || 'React',
 tags: [],
 }))
 setFlashcardDefs(defs)
 setCards(defs.map(def => ({
 ...def,
 ...INITIAL_CARD_STATE,
 nextReview: 0,
 })))
 })
 .catch(() => { /* silent */ })
 .finally(() => setIsLoadingFlashcards(false))
 }, [isMounted, user])

 // UI state
 const [studyMode, setStudyMode] = useState<StudyMode>('deck')
 const [currentIndex, setCurrentIndex] = useState(0)
 const [isFlipped, setIsFlipped] = useState(false)
 const [showRating, setShowRating] = useState(false)
 const [quizOptions, setQuizOptions] = useState<string[]>([])
 const [selectedOption, setSelectedOption] = useState<number | null>(null)
 const [quizAnswered, setQuizAnswered] = useState(false)
 const [isShuffled, setIsShuffled] = useState(false)
 const [studyQueue, setStudyQueue] = useState<number[]>([])

 // Session stats
 const [sessionStats, setSessionStats] = useState<SessionStats>({
 cardsStudied: 0,
 correct: 0,
 total: 0,
 startTime: Date.now(),
 })
 const [isSessionDone, setIsSessionDone] = useState(false)

 // Computed
 const activeCards = useMemo(() => {
 if (studyMode === 'deck') return cards
 // For study modes, only use due cards
 const dueCards = cards.filter(isDue)
 if (dueCards.length === 0) return cards // fallback: show all if none due
 return dueCards
 }, [cards, studyMode])

 const studyCards = useMemo(() => {
 if (studyMode === 'deck') return []
 if (isShuffled && studyQueue.length > 0) {
 return studyQueue.map((idx) => activeCards[idx]).filter(Boolean)
 }
 return activeCards
 }, [activeCards, studyMode, isShuffled, studyQueue])

 const currentCard = studyCards[currentIndex]

 const overallMastery = useMemo(() => {
 if (cards.length === 0) return 0
 return (
 cards.reduce((sum, c) => sum + getMasteryScore(c), 0) / cards.length
 )
 }, [cards])

 const dueTodayCount = cards.filter(isDue).length
 const studiedCount = cards.filter((c) => c.reps > 0).length

 const timeSpent = useMemo(() => {
 return Math.floor((Date.now() - sessionStats.startTime) / 1000)
 }, [sessionStats.startTime])

 // Initialize quiz options when card changes
 useEffect(() => {
 if (studyMode === 'quiz' && currentCard) {
 setQuizOptions(generateQuizOptions(currentCard.answer, flashcardDefs))
 setSelectedOption(null)
 setQuizAnswered(false)
 }
 }, [currentIndex, studyMode, currentCard, flashcardDefs])

 // Shuffle handler
 const handleShuffle = useCallback(() => {
 const indices = activeCards.map((_, i) => i)
 for (let i = indices.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1))
 ;[indices[i], indices[j]] = [indices[j], indices[i]]
 }
 setStudyQueue(indices)
 setIsShuffled(true)
 setCurrentIndex(0)
 setIsFlipped(false)
 setShowRating(false)
 toast.success('Cards shuffled!', { description: 'Study order randomized' })
 }, [activeCards])

 // Navigation
 const goNext = useCallback(() => {
 if (currentIndex < studyCards.length - 1) {
 setCurrentIndex((i) => i + 1)
 setIsFlipped(false)
 setShowRating(false)
 setSelectedOption(null)
 setQuizAnswered(false)
 } else {
 setIsSessionDone(true)
 }
 }, [currentIndex, studyCards.length])

 const goPrev = useCallback(() => {
 if (currentIndex > 0) {
 setCurrentIndex((i) => i - 1)
 setIsFlipped(false)
 setShowRating(false)
 setSelectedOption(null)
 setQuizAnswered(false)
 }
 }, [currentIndex])

 // Rate handler (SM-2)
 const handleRate = useCallback(
 (rating: Rating) => {
 if (!currentCard) return
 setCards((prev) =>
 prev.map((c) =>
 c.id === currentCard.id ? applySM2(c, rating) : c
 )
 )
 setSessionStats((prev) => ({
 ...prev,
 cardsStudied: prev.cardsStudied + 1,
 total: prev.total + 1,
 correct:
 prev.correct + (rating === 'good' || rating === 'easy' ? 1 : 0),
 }))
 goNext()
 },
 [currentCard, goNext]
 )

 // Quiz answer handler
 const handleQuizSelect = useCallback(
 (idx: number) => {
 if (!currentCard || quizAnswered) return
 setSelectedOption(idx)
 setQuizAnswered(true)
 const isCorrect = quizOptions[idx] === currentCard.answer
 // Auto-rate based on quiz result
 const rating: Rating = isCorrect ? 'good' : 'again'
 setCards((prev) =>
 prev.map((c) =>
 c.id === currentCard.id ? applySM2(c, rating) : c
 )
 )
 setSessionStats((prev) => ({
 ...prev,
 cardsStudied: prev.cardsStudied + 1,
 total: prev.total + 1,
 correct: prev.correct + (isCorrect ? 1 : 0),
 }))
 setShowRating(true)
 },
 [currentCard, quizOptions, quizAnswered]
 )

 // Keyboard shortcuts
 useEffect(() => {
 if (studyMode === 'deck') return
 const handler = (e: KeyboardEvent) => {
 // Don't capture if user is typing in an input
 if (
 e.target instanceof HTMLInputElement ||
 e.target instanceof HTMLTextAreaElement
 )
 return

 switch (e.key) {
 case ' ':
 e.preventDefault()
 if (studyMode === 'flashcard' && !showRating) {
 setIsFlipped((f) => !f)
 if (!isFlipped) {
 // Will show rating on next flip to back
 setTimeout(() => setShowRating(true), 100)
 }
 }
 break
 case 'ArrowRight':
 if (showRating || quizAnswered) goNext()
 break
 case 'ArrowLeft':
 goPrev()
 break
 case '1':
 if (showRating && studyMode === 'flashcard') handleRate('again')
 break
 case '2':
 if (showRating && studyMode === 'flashcard') handleRate('hard')
 break
 case '3':
 if (showRating && studyMode === 'flashcard') handleRate('good')
 break
 case '4':
 if (showRating && studyMode === 'flashcard') handleRate('easy')
 break
 }
 }
 window.addEventListener('keydown', handler)
 return () => window.removeEventListener('keydown', handler)
 }, [studyMode, showRating, isFlipped, quizAnswered, goNext, goPrev, handleRate])

 // Handle flip
 const handleFlip = useCallback(() => {
 setIsFlipped((f) => {
 const newFlipped = !f
 if (newFlipped) {
 // Show rating buttons after flipping to back
 setTimeout(() => setShowRating(true), 100)
 } else {
 setShowRating(false)
 }
 return newFlipped
 })
 }, [])

 // Start study from deck view
 const handleStartStudy = useCallback(() => {
 setStudyMode('flashcard')
 setCurrentIndex(0)
 setIsFlipped(false)
 setShowRating(false)
 setIsSessionDone(false)
 setIsShuffled(false)
 setSessionStats({
 cardsStudied: 0,
 correct: 0,
 total: 0,
 startTime: Date.now(),
 })
 }, [])

 const accuracy =
 sessionStats.total > 0
 ? Math.round((sessionStats.correct / sessionStats.total) * 100)
 : 0

 const formatTime = (secs: number) => {
 const m = Math.floor(secs / 60)
 const s = secs % 60
 return `${m}:${s.toString().padStart(2, '0')}`
 }

 return (
 <Card
 className={`${className} overflow-hidden rounded-2xl border-gray-200/50 bg-white/60 backdrop-blur-sm shadow-sm`}
 >
 {isLoadingFlashcards ? (
 <CardContent className="flex flex-col items-center justify-center py-16">
 <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200/30 border-t-neutral-500" />
 <p className="mt-3 text-sm text-gray-500">Loading flashcards...</p>
 </CardContent>
 ) : cards.length === 0 ? (
 <CardContent className="flex flex-col items-center justify-center py-16">
 <Layers className="mb-3 size-10 text-gray-300" />
 <p className="text-sm font-medium text-gray-500">No flashcards available</p>
 <p className="mt-1 text-xs text-gray-400/70">Flashcards will appear here once they are available.</p>
 </CardContent>
 ) : (
 <>
 {/* HEADER */}
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-gray-100">
 <Brain className="size-5 text-gray-600" />
 </div>
 <div>
 <CardTitle className="text-lg font-bold text-foreground">
 Flashcards
 </CardTitle>
 <div className="flex items-center gap-2 text-xs text-gray-500">
 <BookOpen className="size-3" />
 <span>{cards.length} cards</span>
 <span>·</span>
 <span>{studiedCount} studied</span>
 {dueTodayCount > 0 && (
 <>
 <span>·</span>
 <Badge
 variant="secondary"
 className="h-5 gap-1 bg-neutral-100 px-1.5 text-[10px] font-bold text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900"
 >
 <Clock className="size-2.5" />
 {dueTodayCount} due
 </Badge>
 </>
 )}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-1.5">
 {studyMode !== 'deck' && (
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="outline"
 size="icon"
 className="size-8"
 onClick={handleShuffle}
 >
 <Shuffle className="size-4" />
 </Button>
 </TooltipTrigger>
 <TooltipContent>Shuffle cards</TooltipContent>
 </Tooltip>
 )}
 </div>
 </div>

 {/* Overall Mastery Bar */}
 <div className="mt-3 space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="font-medium text-foreground">
 Overall Mastery
 </span>
 <span className="font-bold text-neutral-900 dark:text-neutral-900">
 {Math.round(overallMastery)}%
 </span>
 </div>
 <Progress value={overallMastery} className="h-2" />
 <div className="space-y-1.5 pt-1">
 {CATEGORIES.map((cat) => (
 <CategoryMasteryBar key={cat} category={cat} cards={cards} />
 ))}
 </div>
 </div>
 </CardHeader>

 <CardContent className="pt-0">
 {/* MODE TABS */}
 <Tabs
 value={studyMode}
 onValueChange={(v) => {
 setStudyMode(v as StudyMode)
 setCurrentIndex(0)
 setIsFlipped(false)
 setShowRating(false)
 setSelectedOption(null)
 setQuizAnswered(false)
 setIsSessionDone(false)
 if (v !== 'deck') {
 setSessionStats({
 cardsStudied: 0,
 correct: 0,
 total: 0,
 startTime: Date.now(),
 })
 }
 }}
 >
 <TabsList className="mb-4 w-full">
 <TabsTrigger value="deck" className="flex-1 gap-1.5">
 <Layers className="size-3.5" />
 Deck
 </TabsTrigger>
 <TabsTrigger value="flashcard" className="flex-1 gap-1.5">
 <BookOpen className="size-3.5" />
 Flashcard
 </TabsTrigger>
 <TabsTrigger value="quiz" className="flex-1 gap-1.5">
 <Target className="size-3.5" />
 Quiz
 </TabsTrigger>
 </TabsList>

 {/* DECK VIEW */}
 <TabsContent value="deck">
 <DeckView cards={cards} onStartStudy={handleStartStudy} />
 </TabsContent>

 {/* FLASHCARD / QUIZ VIEW */}
 <TabsContent value="flashcard">
 <AnimatePresence mode="wait">
 {isSessionDone ? (
 <motion.div
 key="done"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.4, ease: 'easeOut' as const }}
 className="flex flex-col items-center justify-center py-12 text-center"
 >
 <motion.div
 initial={{ scale: 0, rotate: -180 }}
 animate={{ scale: 1, rotate: 0 }}
 transition={{
 type: 'spring' as const,
 stiffness: 200,
 damping: 15,
 }}
 className="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 shadow-lg shadow-sm/30"
 >
 <Trophy className="size-8 text-white" />
 </motion.div>
 <h3 className="text-lg font-bold text-foreground">
 Session Complete!
 </h3>
 <p className="mt-1 text-sm text-gray-600">
 You studied {sessionStats.cardsStudied} cards with{' '}
 {accuracy}% accuracy
 </p>
 <div className="mt-4 flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={handleStartStudy}
 className="gap-1.5"
 >
 <RotateCcw className="size-3.5" />
 Study Again
 </Button>
 <Button
 size="sm"
 onClick={() => setStudyMode('deck')}
 className="gap-1.5 bg-white border border-neutral-200"
 >
 <Layers className="size-3.5" />
 Back to Deck
 </Button>
 </div>
 </motion.div>
 ) : currentCard ? (
 <motion.div
 key={currentCard.id}
 initial={{ opacity: 0, x: 40 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -40 }}
 transition={{ duration: 0.3, ease: 'easeOut' as const }}
 >
 {/* Session Stats Bar */}
 <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
 <span className="font-medium">
 {currentIndex + 1} of {studyCards.length}
 </span>
 <div className="flex items-center gap-3">
 <span className="flex items-center gap-1">
 <Zap className="size-3" />
 {accuracy}%
 </span>
 <span className="flex items-center gap-1">
 <Clock className="size-3" />
 {formatTime(timeSpent)}
 </span>
 <span className="flex items-center gap-1">
 <CheckCircle2 className="size-3 text-neutral-900" />
 {sessionStats.correct}/{sessionStats.total}
 </span>
 </div>
 </div>

 <FlipCard
 card={currentCard}
 isFlipped={isFlipped}
 onFlip={handleFlip}
 showRating={showRating}
 onRate={handleRate}
 studyMode="flashcard"
 />

 {/* Navigation */}
 <div className="mt-4 flex items-center justify-between">
 <Button
 variant="outline"
 size="sm"
 disabled={currentIndex === 0}
 onClick={goPrev}
 className="gap-1.5"
 >
 <ChevronLeft className="size-4" />
 <span className="hidden sm:inline">Previous</span>
 </Button>
 <div className="flex gap-1">
 {studyCards.map((_, idx) => (
 <button
 key={idx}
 type="button"
 className={`h-1.5 rounded-full transition-all ${
 idx === currentIndex
 ? 'w-6 bg-neutral-100'
 : idx < currentIndex
 ? 'w-1.5 bg-neutral-100 dark:bg-neutral-100'
 : 'w-1.5 bg-muted-foreground/20'
 }`}
 onClick={() => {
 setCurrentIndex(idx)
 setIsFlipped(false)
 setShowRating(false)
 }}
 />
 ))}
 </div>
 <Button
 variant="outline"
 size="sm"
 disabled={
 currentIndex >= studyCards.length - 1 ||
 (!showRating && !isFlipped)
 }
 onClick={goNext}
 className="gap-1.5"
 >
 <span className="hidden sm:inline">Next</span>
 <ChevronRight className="size-4" />
 </Button>
 </div>
 </motion.div>
 ) : null}
 </AnimatePresence>
 </TabsContent>

 {/* QUIZ MODE */}
 <TabsContent value="quiz">
 <AnimatePresence mode="wait">
 {isSessionDone ? (
 <motion.div
 key="quiz-done"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.4, ease: 'easeOut' as const }}
 className="flex flex-col items-center justify-center py-12 text-center"
 >
 <motion.div
 initial={{ scale: 0, rotate: -180 }}
 animate={{ scale: 1, rotate: 0 }}
 transition={{
 type: 'spring' as const,
 stiffness: 200,
 damping: 15,
 }}
 className="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 shadow-lg shadow-sm/30"
 >
 <Trophy className="size-8 text-white" />
 </motion.div>
 <h3 className="text-lg font-bold text-foreground">
 Quiz Complete!
 </h3>
 <p className="mt-1 text-sm text-gray-600">
 {accuracy}% accuracy — {sessionStats.correct} of{' '}
 {sessionStats.total} correct
 </p>
 <div className="mt-4 flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={handleStartStudy}
 className="gap-1.5"
 >
 <RotateCcw className="size-3.5" />
 Try Again
 </Button>
 <Button
 size="sm"
 onClick={() => setStudyMode('deck')}
 className="gap-1.5 bg-white border border-neutral-200"
 >
 <Layers className="size-3.5" />
 Back to Deck
 </Button>
 </div>
 </motion.div>
 ) : currentCard ? (
 <motion.div
 key={currentCard.id}
 initial={{ opacity: 0, x: 40 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -40 }}
 transition={{ duration: 0.3, ease: 'easeOut' as const }}
 >
 {/* Session Stats Bar */}
 <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
 <span className="font-medium">
 {currentIndex + 1} of {studyCards.length}
 </span>
 <div className="flex items-center gap-3">
 <span className="flex items-center gap-1">
 <Target className="size-3" />
 {accuracy}%
 </span>
 <span className="flex items-center gap-1">
 <Clock className="size-3" />
 {formatTime(timeSpent)}
 </span>
 <span className="flex items-center gap-1">
 <CheckCircle2 className="size-3 text-neutral-900" />
 {sessionStats.correct}/{sessionStats.total}
 </span>
 </div>
 </div>

 <FlipCard
 card={currentCard}
 isFlipped={false}
 onFlip={() => {}}
 showRating={quizAnswered}
 onRate={() => {}}
 studyMode="quiz"
 quizOptions={quizOptions}
 selectedOption={selectedOption}
 onQuizSelect={handleQuizSelect}
 />

 {/* Navigation */}
 <div className="mt-4 flex items-center justify-between">
 <Button
 variant="outline"
 size="sm"
 disabled={currentIndex === 0}
 onClick={goPrev}
 className="gap-1.5"
 >
 <ChevronLeft className="size-4" />
 <span className="hidden sm:inline">Previous</span>
 </Button>
 <div className="flex gap-1">
 {studyCards.map((_, idx) => (
 <button
 key={idx}
 type="button"
 className={`h-1.5 rounded-full transition-all ${
 idx === currentIndex
 ? 'w-6 bg-neutral-100'
 : idx < currentIndex
 ? 'w-1.5 bg-neutral-100 dark:bg-neutral-100'
 : 'w-1.5 bg-muted-foreground/20'
 }`}
 onClick={() => {
 setCurrentIndex(idx)
 setSelectedOption(null)
 setQuizAnswered(false)
 }}
 />
 ))}
 </div>
 <Button
 variant="outline"
 size="sm"
 disabled={!quizAnswered}
 onClick={goNext}
 className="gap-1.5"
 >
 <span className="hidden sm:inline">Next</span>
 <ChevronRight className="size-4" />
 </Button>
 </div>
 </motion.div>
 ) : null}
 </AnimatePresence>
 </TabsContent>
 </Tabs>
 </CardContent>
 </>
 )}
 </Card>
 )
}
