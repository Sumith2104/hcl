'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
 Brain,
 Zap,
 Trophy,
 Target,
 Clock,
 Star,
 Flame,
 ChevronRight,
 RotateCcw,
 Play,
 Timer,
 CheckCircle2,
 XCircle,
 Award,
 BarChart3,
 History,
 Sparkles,
 Keyboard,
 Layers,
 Cpu,
 Database,
 Server,
 GitBranch,
 Box,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ==================== TYPES ====================

type QuizCategory =
 | 'Frontend'
 | 'Backend'
 | 'AI/ML'
 | 'Data Science'
 | 'DevOps'
 | 'System Design'

type GameMode = 'quick' | 'category' | 'zen'

type QuizOption = {
 id: string
 text: string
}

type QuizQuestion = {
 id: string
 question: string
 options: QuizOption[]
 correctIndex: number
 category: QuizCategory
 difficulty: 'easy' | 'medium' | 'hard'
}

type AnswerResult = {
 questionId: string
 question: string
 category: QuizCategory
 selectedIndex: number
 correctIndex: number
 isCorrect: boolean
 timeTaken: number
 scoreEarned: number
}

type QuizAttempt = {
 id: string
 mode: GameMode
 category?: QuizCategory
 score: number
 maxScore: number
 accuracy: number
 totalQuestions: number
 correctAnswers: number
 bestStreak: number
 totalTime: number
 grade: string
 results: AnswerResult[]
 timestamp: number
}

type GameState = 'idle' | 'playing' | 'answered' | 'finished'

// ==================== HELPERS ====================

const CATEGORY_META: Record<QuizCategory, { icon: typeof Brain; color: string; bg: string; border: string }> = {
 Frontend: { icon: Layers, color: 'text-neutral-900', bg: 'bg-neutral-100/10', border: 'border-neutral-200/30' },
 Backend: { icon: Server, color: 'text-neutral-900', bg: 'bg-neutral-100/10', border: 'border-neutral-200/30' },
 'AI/ML': { icon: Cpu, color: 'text-neutral-700', bg: 'bg-neutral-100/10', border: 'border-neutral-200/30' },
 'Data Science': { icon: Database, color: 'text-neutral-700', bg: 'bg-neutral-100/10', border: 'border-neutral-200/30' },
 DevOps: { icon: GitBranch, color: 'text-neutral-700', bg: 'bg-neutral-100/10', border: 'border-neutral-200/30' },
 'System Design': { icon: Box, color: 'text-neutral-700', bg: 'bg-neutral-100/10', border: 'border-neutral-200/30' },
}

const GRADE_THRESHOLDS = [
 { grade: 'S', min: 95, color: 'text-neutral-700' },
 { grade: 'A', min: 85, color: 'text-neutral-900' },
 { grade: 'B', min: 70, color: 'text-neutral-900' },
 { grade: 'C', min: 55, color: 'text-neutral-700' },
 { grade: 'D', min: 40, color: 'text-neutral-700' },
 { grade: 'F', min: 0, color: 'text-neutral-700' },
] as const

function getGrade(accuracy: number): { grade: string; color: string } {
 const entry = GRADE_THRESHOLDS.find(g => accuracy >= g.min)
 return entry ? { grade: entry.grade, color: entry.color } : { grade: 'F', color: 'text-neutral-700' }
}

function shuffleArray<T>(arr: T[]): T[] {
 const shuffled = [...arr]
 for (let i = shuffled.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
 }
 return shuffled
}

function getMultiplier(s: number): number {
 if (s >= 5) return 3
 if (s >= 3) return 2
 return 1
}

// ==================== CONFETTI PARTICLES ====================

function ConfettiBurst() {
 const particles = useMemo(() =>
 Array.from({ length: 20 }, (_, i) => ({
 id: i,
 x: (Math.random() - 0.5) * 300,
 y: (Math.random() - 0.8) * 200,
 rotate: Math.random() * 720 - 360,
 scale: Math.random() * 0.6 + 0.4,
 color: ['#171717', '#737373', '#a3a3a3', '#e5e5e5', '#e5e5e5', '#e5e5e5'][
 Math.floor(Math.random() * 6)
 ],
 delay: Math.random() * 0.15,
 })),
 )

 return (
 <div className="pointer-events-none absolute inset-0 overflow-hidden">
 {particles.map(p => (
 <motion.div
 key={p.id}
 className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-sm"
 style={{ backgroundColor: p.color }}
 initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0 }}
 animate={{
 x: p.x,
 y: p.y + 100,
 rotate: p.rotate,
 opacity: 0,
 scale: p.scale,
 }}
 transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' as const }}
 />
 ))}
 </div>
 )
}

// ==================== STREAK FIRE DISPLAY ====================

function StreakFire({ streak }: { streak: number }) {
 if (streak < 2) return null
 return (
 <motion.div
 className="flex items-center gap-1"
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: 'spring', stiffness: 500, damping: 15 }}
 >
 <Flame className={cn('h-5 w-5 animate-flame', streak >= 5 ? 'text-neutral-700' : 'text-neutral-700')} />
 <span className={cn('text-sm font-bold', streak >= 5 ? 'text-neutral-700' : 'text-neutral-700')}>
 {streak}x
 </span>
 </motion.div>
 )
}

// ==================== GRADE BADGE ====================

function GradeBadge({ grade, color, size = 'lg' }: { grade: string; color: string; size?: 'sm' | 'lg' }) {
 return (
 <motion.div
 className={cn(
 'flex items-center justify-center rounded-2xl font-black',
 size === 'lg' ? 'h-24 w-24 text-5xl' : 'h-10 w-10 text-lg',
 'bg-gradient-to-br from-white/20 to-white/10 border border-white/10',
 )}
 initial={{ scale: 0, rotate: -180 }}
 animate={{ scale: 1, rotate: 0 }}
 transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
 >
 <span className={color}>{grade}</span>
 </motion.div>
 )
}

// ==================== MAIN COMPONENT ====================

export function QuizChallengePanel({ className }: { className?: string }) {
 const { user } = useAppStore()
 const isMounted = useIsMounted()
 const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
 const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
 const [gameState, setGameState] = useState<GameState>('idle')
 const [gameMode, setGameMode] = useState<GameMode>('quick')
 const [selectedCategory, setSelectedCategory] = useState<QuizCategory>('Frontend')
 const [questions, setQuestions] = useState<QuizQuestion[]>([])
 const [currentIdx, setCurrentIdx] = useState(0)
 const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
 const [results, setResults] = useState<AnswerResult[]>([])
 const [score, setScore] = useState(0)
 const [streak, setStreak] = useState(0)
 const [bestStreak, setBestStreak] = useState(0)
 const [timeLeft, setTimeLeft] = useState(30)
 const [questionStart, setQuestionStart] = useState(0)
 const [showConfetti, setShowConfetti] = useState(false)
 const [history, setHistory] = useState<QuizAttempt[]>([])
 const [historyOpen, setHistoryOpen] = useState(false)

 const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

 // Fetch questions from API
 useEffect(() => {
 if (!isMounted || !user) return
 fetch(`/api/quiz-questions?userId=${user.id}`)
 .then(r => r.json())
 .then(data => {
 const mapped: QuizQuestion[] = (data.questions || []).map((q: Record<string, unknown>) => {
 const options = (q.options as string[]).map((text: string, i: number) => ({
 id: String.fromCharCode(97 + i),
 text,
 }))
 const correctIndex = options.findIndex(o => o.text === q.correctAnswer)
 return {
 id: q.id as string,
 question: q.question as string,
 options,
 correctIndex: correctIndex >= 0 ? correctIndex : 0,
 category: q.category as QuizCategory,
 difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'easy',
 }
 })
 setAllQuestions(mapped)
 })
 .catch(() => { /* silent */ })
 .finally(() => setIsLoadingQuestions(false))
 }, [isMounted, user])

 const currentQuestion = questions[currentIdx] ?? null
 const progressPct = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0
 const isTimed = gameMode === 'quick'

 // Handle answer selection - MUST be before timer useEffect
 const handleAnswer = useCallback((idx: number) => {
 setSelectedIndex(idx)
 setGameState('answered')

 const timeTaken = (Date.now() - questionStart) / 1000
 const isCorrect = idx === currentQuestion?.correctIndex
 const speedBonus = isCorrect && timeTaken < 10 ? 5 : 0
 const multiplier = isCorrect ? getMultiplier(streak) : 1
 const earned = isCorrect ? (10 + speedBonus) * multiplier : 0

 if (!currentQuestion) return

 const result: AnswerResult = {
 questionId: currentQuestion.id,
 question: currentQuestion.question,
 category: currentQuestion.category,
 selectedIndex: idx,
 correctIndex: currentQuestion.correctIndex,
 isCorrect,
 timeTaken,
 scoreEarned: earned,
 }

 setResults(prev => [...prev, result])
 setScore(prev => prev + earned)

 if (isCorrect) {
 const newStreak = streak + 1
 setStreak(newStreak)
 if (newStreak > bestStreak) setBestStreak(newStreak)
 setShowConfetti(true)
 setTimeout(() => setShowConfetti(false), 1000)
 if (speedBonus > 0) {
 toast.success(`Speed bonus! +${earned} pts`, { description: `${timeTaken.toFixed(1)}s ⚡` })
 }
 } else {
 setStreak(0)
 if (idx === -1) {
 toast.error("Time's up!")
 } else {
 toast.error('Incorrect!')
 }
 }
 }, [currentQuestion, questionStart, streak, bestStreak])

 // Timer
 useEffect(() => {
 if (!isTimed || gameState !== 'playing') {
 if (timerRef.current) clearInterval(timerRef.current)
 return
 }
 timerRef.current = setInterval(() => {
 setTimeLeft(prev => {
 if (prev <= 1) {
 handleAnswer(-1)
 return 30
 }
 return prev - 1
 })
 }, 1000)
 return () => {
 if (timerRef.current) clearInterval(timerRef.current)
 }
 }, [gameState, isTimed, currentIdx, handleAnswer])

 // Start game
 const startGame = useCallback((mode: GameMode, category?: QuizCategory) => {
 if (allQuestions.length === 0) {
 toast.error('No questions available yet. Please wait for data to load.')
 return
 }
 let pool: QuizQuestion[]
 if (mode === 'quick') {
 pool = shuffleArray(allQuestions).slice(0, 5)
 } else if (mode === 'category' && category) {
 pool = allQuestions.filter(q => q.category === category)
 } else {
 pool = shuffleArray(allQuestions)
 }

 setGameMode(mode)
 setSelectedCategory(category ?? 'Frontend')
 setQuestions(pool)
 setCurrentIdx(0)
 setSelectedIndex(null)
 setResults([])
 setScore(0)
 setStreak(0)
 setBestStreak(0)
 setTimeLeft(30)
 setQuestionStart(Date.now())
 setShowConfetti(false)
 setGameState('playing')
 toast.success(mode === 'quick' ? 'Quick Quiz started! ⚡' : mode === 'category' ? `Category Challenge: ${category}` : 'Zen Mode activated 🧘')
 }, [allQuestions])

 // Next question
 const nextQuestion = useCallback(() => {
 if (gameMode === 'zen') {
 const nextIdx = (currentIdx + 1) % questions.length
 if (nextIdx === 0) {
 setQuestions(prev => shuffleArray(prev))
 }
 setCurrentIdx(nextIdx)
 setSelectedIndex(null)
 setTimeLeft(30)
 setQuestionStart(Date.now())
 setGameState('playing')
 return
 }

 if (currentIdx + 1 >= questions.length) {
 // Compute from results to avoid stale state
 setResults(currentResults => {
 const correctCount = currentResults.filter(r => r.isCorrect).length
 const totalQ = currentResults.length
 const accuracy = totalQ > 0 ? (correctCount / totalQ) * 100 : 0
 const totalTime = currentResults.reduce((sum, r) => sum + r.timeTaken, 0)
 const totalScore = currentResults.reduce((sum, r) => sum + r.scoreEarned, 0)
 const { grade } = getGrade(accuracy)

 let s = 0
 let maxS = 0
 for (const r of currentResults) {
 if (r.isCorrect) { s++; maxS = Math.max(maxS, s) } else { s = 0 }
 }

 const attempt: QuizAttempt = {
 id: `attempt-${Date.now()}`,
 mode: gameMode,
 category: selectedCategory,
 score: totalScore,
 maxScore: totalQ * 30,
 accuracy: Math.round(accuracy),
 totalQuestions: totalQ,
 correctAnswers: correctCount,
 bestStreak: maxS,
 totalTime: Math.round(totalTime),
 grade,
 results: [...currentResults],
 timestamp: Date.now(),
 }

 setHistory(prev => [attempt, ...prev].slice(0, 10))
 setGameState('finished')
 return currentResults
 })
 return
 }

 setCurrentIdx(prev => prev + 1)
 setSelectedIndex(null)
 setTimeLeft(30)
 setQuestionStart(Date.now())
 setGameState('playing')
 }, [gameMode, currentIdx, questions.length, selectedCategory])

 // Keyboard support
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (gameState === 'playing') {
 if (e.key >= '1' && e.key <= '4') {
 const idx = parseInt(e.key) - 1
 if (idx < (currentQuestion?.options.length ?? 0)) {
 handleAnswer(idx)
 }
 }
 }
 if (gameState === 'answered' && e.key === 'Enter') {
 nextQuestion()
 }
 }
 window.addEventListener('keydown', handleKeyDown)
 return () => window.removeEventListener('keydown', handleKeyDown)
 }, [gameState, currentQuestion, handleAnswer, nextQuestion])

 // ==================== RENDER: IDLE ====================

 const renderIdle = () => (
 <div className="space-y-6">
 {isLoadingQuestions ? (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200/30 border-t-neutral-500" />
 <p className="mt-3 text-sm text-slate-400">Loading questions...</p>
 </div>
 ) : allQuestions.length === 0 ? (
 <motion.div
 className="glass-card rounded-2xl p-6 text-center"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, ease: 'easeOut' as const }}
 >
 <Brain className="mx-auto mb-4 h-12 w-12 text-slate-500" />
 <h3 className="text-lg font-semibold text-white">No Questions Available</h3>
 <p className="mt-1 text-sm text-slate-400">Quiz questions will appear here once they are available.</p>
 </motion.div>
 ) : (
 <>
 <motion.div
 className="glass-card rounded-2xl p-6 text-center"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, ease: 'easeOut' as const }}
 >
 <motion.div
 className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/10"
 animate={{ rotate: [0, 5, -5, 0] }}
 transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
 >
 <Brain className="h-8 w-8 text-neutral-900" />
 </motion.div>
 <h3 className="text-xl font-bold text-white">Knowledge Quiz Challenge</h3>
 <p className="mt-1 text-sm text-slate-400">Test your tech knowledge across 6 categories</p>
 </motion.div>

 <div className="grid gap-4 sm:grid-cols-3">
 <motion.button
 onClick={() => startGame('quick')}
 className="card-elevated hover-lift group rounded-xl border border-neutral-200/20 bg-gradient-to-br from-white/10 to-white/5 p-5 text-left transition-colors hover:border-neutral-200/40"
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 >
 <Zap className="mb-3 h-8 w-8 text-neutral-900 transition-transform group-hover:scale-110" />
 <h4 className="font-semibold text-white">Quick Quiz</h4>
 <p className="mt-1 text-xs text-slate-400">5 random questions · 30s timer</p>
 <div className="mt-3 flex items-center gap-2">
 <Badge variant="outline" className="border-neutral-200/30 text-neutral-900">Fast</Badge>
 <Badge variant="outline" className="border-neutral-200/30 text-neutral-700">Timed</Badge>
 </div>
 </motion.button>

 <motion.button
 onClick={() => startGame('category', selectedCategory)}
 className="card-elevated hover-lift group rounded-xl border border-neutral-200/20 bg-gradient-to-br from-white/10 to-white/5 p-5 text-left transition-colors hover:border-neutral-200/40"
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 >
 <Target className="mb-3 h-8 w-8 text-neutral-900 transition-transform group-hover:scale-110" />
 <h4 className="font-semibold text-white">Category Challenge</h4>
 <p className="mt-1 text-xs text-slate-400">All questions in a category · No timer</p>
 <div className="mt-3 flex items-center gap-2">
 <Badge variant="outline" className="border-neutral-200/30 text-neutral-900">Focused</Badge>
 <Badge variant="outline" className="border-neutral-200/30 text-neutral-700">Deep</Badge>
 </div>
 </motion.button>

 <motion.button
 onClick={() => startGame('zen')}
 className="card-elevated hover-lift group rounded-xl border border-neutral-200/20 bg-gradient-to-br from-white/10 to-white/5 p-5 text-left transition-colors hover:border-neutral-200/40"
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 >
 <Sparkles className="mb-3 h-8 w-8 text-neutral-700 transition-transform group-hover:scale-110" />
 <h4 className="font-semibold text-white">Zen Mode</h4>
 <p className="mt-1 text-xs text-slate-400">Infinite questions · No pressure</p>
 <div className="mt-3 flex items-center gap-2">
 <Badge variant="outline" className="border-neutral-200/30 text-neutral-700">Relaxed</Badge>
 <Badge variant="outline" className="border-neutral-200/30 text-neutral-700">∞</Badge>
 </div>
 </motion.button>
 </div>

 <div className="space-y-3">
 <h4 className="text-sm font-medium text-slate-400">Category Challenge Topic</h4>
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
 {(Object.keys(CATEGORY_META) as QuizCategory[]).map(cat => {
 const meta = CATEGORY_META[cat]
 const Icon = meta.icon
 const count = allQuestions.filter(q => q.category === cat).length
 return (
 <motion.button
 key={cat}
 onClick={() => setSelectedCategory(cat)}
 className={cn(
 'flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all',
 selectedCategory === cat
 ? cn(meta.border, meta.bg, 'shadow-sm')
 : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50',
 )}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 >
 <Icon className={cn('h-4 w-4 shrink-0', meta.color)} />
 <div className="min-w-0">
 <div className="truncate font-medium text-white">{cat}</div>
 <div className="text-xs text-slate-500">{count} questions</div>
 </div>
 </motion.button>
 )
 })}
 </div>
 </div>

 <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
 <Keyboard className="h-3.5 w-3.5" />
 <span>Use 1-4 keys to answer · Enter to continue</span>
 </div>

 {history.length > 0 && (
 <div className="space-y-3">
 <button
 onClick={() => setHistoryOpen(!historyOpen)}
 className="flex w-full items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/50"
 >
 <div className="flex items-center gap-2">
 <History className="h-4 w-4" />
 <span>Recent Attempts ({history.length})</span>
 </div>
 <motion.span
 animate={{ rotate: historyOpen ? 180 : 0 }}
 transition={{ duration: 0.2, ease: 'easeOut' as const }}
 >
 <ChevronRight className="h-4 w-4" />
 </motion.span>
 </button>

 <AnimatePresence>
 {historyOpen && (
 <motion.div
 className="max-h-96 space-y-2 overflow-y-auto pr-1"
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.3, ease: 'easeOut' as const }}
 >
 {history.map(attempt => (
 <div
 key={attempt.id}
 className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/20 px-4 py-3"
 >
 <div className="flex items-center gap-3">
 <GradeBadge grade={attempt.grade} color={attempt.grade === 'S' ? 'text-neutral-700' : attempt.grade === 'A' ? 'text-neutral-900' : 'text-slate-300'} size="sm" />
 <div>
 <div className="text-sm font-medium text-white">
 {attempt.mode === 'quick' ? 'Quick Quiz' : attempt.mode === 'category' ? attempt.category : 'Zen Mode'}
 </div>
 <div className="text-xs text-slate-500">
 {attempt.correctAnswers}/{attempt.totalQuestions} correct · {attempt.totalTime}s
 </div>
 </div>
 </div>
 <div className="text-right">
 <div className="text-sm font-semibold text-neutral-900">{attempt.score} pts</div>
 <div className="text-xs text-slate-500">{attempt.accuracy}%</div>
 </div>
 </div>
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )}
 </>
 )}
 </div>
 )

 // ==================== RENDER: PLAYING ====================

 const renderPlaying = () => {
 if (!currentQuestion) return null
 const meta = CATEGORY_META[currentQuestion.category]
 const CatIcon = meta.icon
 const lastResult = results[results.length - 1]

 return (
 <div className="space-y-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1', meta.bg, meta.border, 'border')}>
 <CatIcon className={cn('h-3.5 w-3.5', meta.color)} />
 <span className={cn('text-xs font-medium', meta.color)}>{currentQuestion.category}</span>
 </div>
 <Badge variant="outline" className="border-slate-600/50 text-xs text-slate-400">
 {currentQuestion.difficulty}
 </Badge>
 </div>
 <div className="flex items-center gap-4">
 <StreakFire streak={streak} />
 <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
 <Star className="h-4 w-4" />
 {score}
 </div>
 </div>
 </div>

 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-xs text-slate-500">
 <span>Question {currentIdx + 1}{gameMode === 'zen' ? '+' : ` of ${questions.length}`}</span>
 {isTimed && (
 <div className={cn('flex items-center gap-1', timeLeft <= 10 ? 'text-neutral-700' : 'text-slate-400')}>
 <Timer className="h-3 w-3" />
 <span className={cn(timeLeft <= 10 && 'animate-pulse')}>{timeLeft}s</span>
 </div>
 )}
 {gameMode === 'zen' && (
 <Badge variant="outline" className="border-neutral-200/30 text-neutral-700">
 <Sparkles className="mr-1 h-3 w-3" />Zen
 </Badge>
 )}
 </div>
 <Progress value={gameMode === 'zen' ? 100 : progressPct} className="h-1.5" />
 </div>

 {isTimed && (
 <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
 <motion.div
 className={cn(
 'h-full rounded-full',
 timeLeft > 20 ? 'bg-neutral-100' : timeLeft > 10 ? 'bg-neutral-100' : 'bg-neutral-100',
 )}
 initial={{ width: '100%' }}
 animate={{ width: `${(timeLeft / 30) * 100}%` }}
 transition={{ duration: 0.5, ease: 'linear' as const }}
 />
 </div>
 )}

 <motion.div
 key={currentQuestion.id}
 className="glass-card relative overflow-hidden rounded-xl p-6"
 initial={{ opacity: 0, x: 40 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.35, ease: 'easeOut' as const }}
 >
 {showConfetti && <ConfettiBurst />}
 <h3 className="text-lg font-semibold leading-relaxed text-white">{currentQuestion.question}</h3>

 <div className="mt-5 space-y-3">
 {currentQuestion.options.map((opt, i) => {
 const isSelected = selectedIndex === i
 const isCorrect = i === currentQuestion.correctIndex
 const isAnswered = gameState === 'answered'

 let optionClass = 'border-slate-700/50 bg-slate-800/30 hover:border-neutral-200/30 hover:bg-neutral-100/5'
 if (isAnswered) {
 if (isCorrect) {
 optionClass = 'border-gray-200 bg-gray-50 shadow-[0_0_20px_rgba(156,163,175,0.2)]'
 } else if (isSelected && !isCorrect) {
 optionClass = 'border-neutral-200 bg-neutral-100/15'
 } else {
 optionClass = 'border-slate-700/30 bg-slate-800/20 opacity-50'
 }
 }

 return (
 <motion.button
 key={opt.id}
 onClick={() => handleAnswer(i)}
 disabled={isAnswered}
 className={cn(
 'flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-all min-h-[52px]',
 optionClass,
 isAnswered && isCorrect && 'ring-1 ring-neutral-300/50',
 isAnswered && isSelected && !isCorrect && 'animate-[shake_0.4s_ease-in-out]',
 )}
 whileHover={!isAnswered ? { scale: 1.01, x: 4 } : undefined}
 whileTap={!isAnswered ? { scale: 0.99 } : undefined}
 >
 <span
 className={cn(
 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold',
 isAnswered && isCorrect
 ? 'bg-neutral-900 text-white'
 : isAnswered && isSelected && !isCorrect
 ? 'bg-neutral-100 text-white'
 : 'bg-slate-700/50 text-slate-400',
 )}
 >
 {i + 1}
 </span>
 <span
 className={cn(
 'flex-1 text-sm',
 isAnswered && isCorrect ? 'font-medium text-neutral-900' : isAnswered && isSelected && !isCorrect ? 'text-neutral-700' : 'text-slate-200',
 )}
 >
 {opt.text}
 </span>
 {isAnswered && isCorrect && (
 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
 <CheckCircle2 className="h-5 w-5 text-neutral-900" />
 </motion.div>
 )}
 {isAnswered && isSelected && !isCorrect && (
 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
 <XCircle className="h-5 w-5 text-neutral-700" />
 </motion.div>
 )}
 </motion.button>
 )
 })}
 </div>

 <AnimatePresence>
 {gameState === 'answered' && lastResult && lastResult.questionId === currentQuestion.id && (
 <motion.div
 className="mt-5 flex items-center justify-between"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.25, ease: 'easeOut' as const }}
 >
 <div className="flex items-center gap-2">
 {lastResult.isCorrect ? (
 <>
 <CheckCircle2 className="h-5 w-5 text-neutral-900" />
 <span className="text-sm font-medium text-neutral-900">Correct!</span>
 {lastResult.scoreEarned > 0 && (
 <Badge className="border-0 bg-neutral-100/20 text-neutral-900">+{lastResult.scoreEarned} pts</Badge>
 )}
 </>
 ) : (
 <>
 <XCircle className="h-5 w-5 text-neutral-700" />
 <span className="text-sm font-medium text-neutral-700">
 {lastResult.selectedIndex === -1 ? "Time's up!" : 'Incorrect'}
 </span>
 </>
 )}
 </div>
 <Button onClick={nextQuestion} size="sm" className="bg-neutral-900 text-white hover:bg-neutral-100">
 {gameMode === 'zen' || currentIdx + 1 < questions.length ? (
 <>Next <ChevronRight className="ml-1 h-4 w-4" /></>
 ) : (
 <>See Results <Trophy className="ml-1 h-4 w-4" /></>
 )}
 </Button>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>

 {streak >= 3 && gameState === 'playing' && (
 <motion.div
 className="flex items-center justify-center gap-2 text-sm"
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ type: 'spring', stiffness: 400, damping: 15 }}
 >
 <Flame className={cn('h-4 w-4 animate-flame', streak >= 5 ? 'text-neutral-700' : 'text-neutral-700')} />
 <span className={cn('font-bold', streak >= 5 ? 'text-neutral-700' : 'text-neutral-700')}>
 {getMultiplier(streak)}x Multiplier Active!
 </span>
 </motion.div>
 )}
 </div>
 )
 }

 // ==================== RENDER: FINISHED ====================

 const renderFinished = () => {
 const correctCount = results.filter(r => r.isCorrect).length
 const totalQ = results.length
 const accuracy = totalQ > 0 ? (correctCount / totalQ) * 100 : 0
 const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0)
 const { grade, color } = getGrade(accuracy)

 const catBreakdown: Record<string, { correct: number; total: number }> = {}
 results.forEach(r => {
 if (!catBreakdown[r.category]) catBreakdown[r.category] = { correct: 0, total: 0 }
 catBreakdown[r.category].total++
 if (r.isCorrect) catBreakdown[r.category].correct++
 })

 return (
 <motion.div
 className="space-y-6"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, ease: 'easeOut' as const }}
 >
 <div className="glass-card gradient-border-animated rounded-2xl p-8 text-center">
 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}>
 <GradeBadge grade={grade} color={color} />
 </motion.div>
 <motion.h3
 className="mt-4 text-2xl font-bold text-white"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3, ease: 'easeOut' as const }}
 >
 {accuracy >= 90 ? 'Outstanding!' : accuracy >= 70 ? 'Great Job!' : accuracy >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
 </motion.h3>
 <motion.div
 className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4, ease: 'easeOut' as const }}
 >
 <div className="rounded-xl bg-slate-800/50 p-3">
 <div className="text-2xl font-bold text-neutral-900">{score}</div>
 <div className="text-xs text-slate-500">Total Score</div>
 </div>
 <div className="rounded-xl bg-slate-800/50 p-3">
 <div className="text-2xl font-bold text-neutral-900">{Math.round(accuracy)}%</div>
 <div className="text-xs text-slate-500">Accuracy</div>
 </div>
 <div className="rounded-xl bg-slate-800/50 p-3">
 <div className="text-2xl font-bold text-neutral-700">{Math.round(totalTime)}s</div>
 <div className="text-xs text-slate-500">Total Time</div>
 </div>
 <div className="rounded-xl bg-slate-800/50 p-3">
 <div className="text-2xl font-bold text-neutral-700">{bestStreak}x</div>
 <div className="text-xs text-slate-500">Best Streak</div>
 </div>
 </motion.div>
 </div>

 <Card className="card-elevated border-slate-700/50 bg-slate-900/50">
 <CardHeader className="pb-3">
 <CardTitle className="flex items-center gap-2 text-base text-white">
 <BarChart3 className="h-4 w-4 text-neutral-900" />Category Breakdown
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {Object.entries(catBreakdown).map(([cat, data]) => {
 const catMeta = CATEGORY_META[cat as QuizCategory]
 const CatIcon = catMeta.icon
 const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
 return (
 <div key={cat} className="space-y-1.5">
 <div className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <CatIcon className={cn('h-3.5 w-3.5', catMeta.color)} />
 <span className="text-slate-300">{cat}</span>
 </div>
 <span className="text-xs text-slate-500">{data.correct}/{data.total} ({pct}%)</span>
 </div>
 <Progress value={pct} className="h-1.5" />
 </div>
 )
 })}
 </div>
 </CardContent>
 </Card>

 <Card className="card-elevated border-slate-700/50 bg-slate-900/50">
 <CardHeader className="pb-3">
 <CardTitle className="flex items-center gap-2 text-base text-white">
 <Award className="h-4 w-4 text-neutral-900" />Question Review
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
 {results.map(r => {
 const q = allQuestions.find(qq => qq.id === r.questionId)
 return (
 <div
 key={r.questionId}
 className={cn(
 'rounded-lg border p-3 text-sm',
 r.isCorrect ? 'border-neutral-200/20 bg-neutral-100/5' : 'border-neutral-200/20 bg-neutral-100/5',
 )}
 >
 <div className="flex items-start gap-2">
 {r.isCorrect ? (
 <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
 ) : (
 <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-700" />
 )}
 <div className="min-w-0 flex-1">
 <p className="text-slate-300">{r.question}</p>
 {!r.isCorrect && q && (
 <p className="mt-1 text-xs text-neutral-900">Correct: {q.options[r.correctIndex].text}</p>
 )}
 <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
 <span>{r.timeTaken.toFixed(1)}s</span>
 {r.scoreEarned > 0 && <span className="text-neutral-900">+{r.scoreEarned} pts</span>}
 </div>
 </div>
 </div>
 </div>
 )
 })}
 </div>
 </CardContent>
 </Card>

 <div className="flex gap-3">
 <Button
 onClick={() => startGame(gameMode, gameMode === 'category' ? selectedCategory : undefined)}
 className="flex-1 bg-neutral-900 text-white hover:bg-neutral-100"
 >
 <RotateCcw className="mr-2 h-4 w-4" />Play Again
 </Button>
 <Button
 variant="outline"
 onClick={() => setGameState('idle')}
 className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
 >
 <Play className="mr-2 h-4 w-4" />Change Mode
 </Button>
 </div>
 </motion.div>
 )
 }

 // ==================== MAIN RENDER ====================

 return (
 <div className={cn('space-y-4', className)}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 {gameState !== 'idle' && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => {
 if (gameState === 'playing' || gameState === 'answered') {
 if (results.length > 0 && gameMode !== 'zen') {
 const correctCount = results.filter(r => r.isCorrect).length
 const accuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0
 const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0)
 const totalScore = results.reduce((sum, r) => sum + r.scoreEarned, 0)
 const { grade } = getGrade(accuracy)
 let s = 0
 let maxS = 0
 for (const r of results) {
 if (r.isCorrect) { s++; maxS = Math.max(maxS, s) } else { s = 0 }
 }
 const attempt: QuizAttempt = {
 id: `attempt-${Date.now()}`,
 mode: gameMode,
 category: selectedCategory,
 score: totalScore,
 maxScore: results.length * 30,
 accuracy: Math.round(accuracy),
 totalQuestions: results.length,
 correctAnswers: correctCount,
 bestStreak: maxS,
 totalTime: Math.round(totalTime),
 grade,
 results: [...results],
 timestamp: Date.now(),
 }
 setHistory(prev => [attempt, ...prev].slice(0, 10))
 }
 }
 setGameState('idle')
 if (timerRef.current) clearInterval(timerRef.current)
 }}
 className="text-slate-400 hover:text-white"
 >
 ← Back
 </Button>
 )}
 </div>
 {(gameState === 'playing' || gameState === 'answered') && (
 <Badge variant="outline" className="border-neutral-200/30 text-neutral-900">
 {gameMode === 'quick' ? '⚡ Quick' : gameMode === 'category' ? '🎯 Category' : '🧘 Zen'}
 </Badge>
 )}
 </div>

 <AnimatePresence mode="wait">
 {gameState === 'idle' && (
 <motion.div key="idle" exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, ease: 'easeOut' as const }}>
 {renderIdle()}
 </motion.div>
 )}
 {(gameState === 'playing' || gameState === 'answered') && (
 <motion.div key={`playing-${currentIdx}`} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2, ease: 'easeOut' as const }}>
 {renderPlaying()}
 </motion.div>
 )}
 {gameState === 'finished' && (
 <motion.div key="finished" exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2, ease: 'easeOut' as const }}>
 {renderFinished()}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )
}
