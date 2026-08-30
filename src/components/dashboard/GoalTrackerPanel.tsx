'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Flag,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore, type LearningGoal } from '@/store'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { toast } from 'sonner'

// ==================== CONSTANTS ====================

const GOAL_CATEGORIES = [
  'Frontend',
  'Backend',
  'AI/ML',
  'Data Science',
  'Projects',
  'Computer Science',
  'DevOps',
  'Mobile',
  'General',
] as const

const CATEGORY_COLORS: Record<string, string> = {
  Frontend: 'bg-gray-100 text-gray-600 border-gray-200',
  Backend: 'bg-gray-100 text-gray-600 border-gray-200',
  'AI/ML': 'bg-gray-100 text-gray-600 border-gray-200',
  'Data Science': 'bg-gray-100 text-gray-600 border-gray-200',
  Projects: 'bg-gray-100 text-gray-600 border-gray-200',
  'Computer Science': 'bg-gray-100 text-gray-600 border-gray-200',
  DevOps: 'bg-gray-100 text-gray-600 border-gray-200',
  Mobile: 'bg-gray-100 text-gray-600 border-gray-200',
  General: 'bg-gray-100 text-gray-600 border-gray-200',
}

const PROGRESS_COLORS = {
  low: 'bg-gray-300',
  mid: 'bg-gray-500',
  high: 'bg-gray-600',
  complete: 'bg-gray-700',
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

const goalCardVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, delay: 0.08 * i, ease: 'easeOut' as const },
  }),
  exit: {
    opacity: 0,
    x: 16,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    transition: { duration: 0.25, ease: 'easeIn' as const },
  },
}

const emptyVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

// ==================== HELPERS ====================

function getDaysUntilDeadline(deadline: string, now: Date): number {
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function getDeadlineColor(daysLeft: number): string {
  if (daysLeft < 0) return 'text-red-500'
  if (daysLeft < 3) return 'text-red-500'
  if (daysLeft < 7) return 'text-gray-500'
  return 'text-gray-500'
}

function getDeadlineLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`
  if (daysLeft === 0) return 'Due today'
  if (daysLeft === 1) return 'Due tomorrow'
  return `${daysLeft}d left`
}

function getProgressColorKey(progress: number, completed: boolean): keyof typeof PROGRESS_COLORS {
  if (completed) return 'complete'
  if (progress >= 60) return 'high'
  if (progress >= 30) return 'mid'
  return 'low'
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ==================== FORM STATE ====================

interface GoalFormData {
  title: string
  description: string
  deadline: string
  category: string
  progress: number
}

const EMPTY_FORM: GoalFormData = {
  title: '',
  description: '',
  deadline: '',
  category: '',
  progress: 0,
}

// ==================== COMPONENT ====================

export function GoalTrackerPanel({ className }: { className?: string }) {
  const user = useAppStore((s) => s.user)
  const userId = user?.id
  const storeGoals = useAppStore((s) => s.learningGoals)
  const setLearningGoals = useAppStore((s) => s.setLearningGoals)
  const mounted = useIsMounted()
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  // Fetch goals from DB on mount
  useEffect(() => {
    if (!mounted || !userId || fetchedRef.current) return
    fetchedRef.current = true
    fetch(`/api/learning-goals?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => {
        setLoading(false)
        const goals: LearningGoal[] = (data.goals || []).map((g: Record<string, unknown>) => ({
          id: g.id as string,
          title: g.title as string,
          description: g.description as string,
          deadline: g.deadline as string,
          progress: g.progress as number,
          category: g.category as string,
          createdAt: g.createdAt as string,
          completed: g.completed as boolean,
        }))
        setLearningGoals(goals)
      })
      .catch(() => { /* keep empty */ })
      .finally(() => setLoading(false))
  }, [mounted, userId, setLearningGoals])

  const addGoal = useCallback(async (goalData: Omit<LearningGoal, 'id' | 'createdAt'>) => {
    if (!userId) return
    try {
      const res = await fetch('/api/learning-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...goalData }),
      })
      if (res.ok) {
        const data = await res.json()
        setLearningGoals([
          { ...goalData, id: data.goal.id, createdAt: data.goal.createdAt || new Date().toISOString() },
          ...storeGoals,
        ])
        toast.success('Goal created!')
      }
    } catch {
      toast.error('Failed to create goal')
    }
  }, [userId, storeGoals, setLearningGoals])

  const toggleGoalComplete = useCallback(async (id: string) => {
    const goal = storeGoals.find((g) => g.id === id)
    if (!goal || !userId) return
    const newCompleted = !goal.completed
    try {
      const res = await fetch('/api/learning-goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id, completed: newCompleted }),
      })
      if (res.ok) {
        setLearningGoals(storeGoals.map((g) =>
          g.id === id
            ? { ...g, completed: newCompleted, progress: newCompleted ? 100 : g.progress }
            : g
        ))
      }
    } catch {
      toast.error('Failed to update goal')
    }
  }, [userId, storeGoals, setLearningGoals])

  const deleteGoal = useCallback(async (id: string) => {
    if (!userId) return
    try {
      const res = await fetch(`/api/learning-goals?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setLearningGoals(storeGoals.filter((g) => g.id !== id))
        toast.success('Goal deleted')
      }
    } catch {
      toast.error('Failed to delete goal')
    }
  }, [userId, storeGoals, setLearningGoals])

  const learningGoals = storeGoals

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<GoalFormData>(EMPTY_FORM)

  // Sort: incomplete first (by deadline), then completed
  const sortedGoals = useMemo(() => {
    return [...learningGoals].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
  }, [learningGoals])

  const handleFormChange = useCallback(
    (field: keyof GoalFormData, value: string | number) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSave = useCallback(() => {
    if (!form.title.trim() || !form.deadline || !form.category) return

    addGoal({
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: new Date(form.deadline).toISOString(),
      progress: form.progress,
      category: form.category,
      completed: form.progress === 100,
    })

    setForm(EMPTY_FORM)
    setDialogOpen(false)
  }, [form, addGoal])

  const handleOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) setForm(EMPTY_FORM)
  }, [])

  const isFormValid =
    form.title.trim().length > 0 && form.deadline.length > 0 && form.category.length > 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card className="overflow-hidden glass-card">
        {/* Header */}
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Target className="h-4.5 w-4.5 text-gray-600" />
            </div>
            <CardTitle className="text-base">Learning Goals</CardTitle>
          </div>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1.5 border-gray-200 bg-gray-100 text-gray-600"
            >
              <Flag className="h-3 w-3" />
              {learningGoals.length}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 pt-0">
          {/* Add Goal Button */}
          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-600" />
                  New Learning Goal
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 pt-2">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="goal-title">Title</Label>
                  <Input
                    id="goal-title"
                    placeholder="e.g. Master TypeScript Generics"
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="goal-desc">Description</Label>
                  <Textarea
                    id="goal-desc"
                    placeholder="What do you want to achieve?"
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Category & Deadline row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(val) => handleFormChange('category', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="goal-deadline">Deadline</Label>
                    <Input
                      id="goal-deadline"
                      type="date"
                      value={form.deadline}
                      onChange={(e) => handleFormChange('deadline', e.target.value)}
                      min="2025-01-01"
                    />
                  </div>
                </div>

                {/* Progress Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Initial Progress</Label>
                    <span className="text-sm font-medium text-gray-600">
                      {form.progress}%
                    </span>
                  </div>
                  <Slider
                    value={[form.progress]}
                    onValueChange={(val) => handleFormChange('progress', val[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="mt-1 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                >
                  Save Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Goals List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            </div>
          ) : sortedGoals.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {sortedGoals.map((goal, i) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    index={i}
                    onToggleComplete={toggleGoalComplete}
                    onDelete={deleteGoal}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ==================== GOAL CARD ====================

interface GoalCardProps {
  goal: LearningGoal
  index: number
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
}

function GoalCard({ goal, index, onToggleComplete, onDelete }: GoalCardProps) {
  const daysLeft = getDaysUntilDeadline(goal.deadline, new Date())
  const deadlineColor = getDeadlineColor(daysLeft)
  const deadlineLabel = getDeadlineLabel(daysLeft)
  const progressKey = getProgressColorKey(goal.progress, goal.completed)
  const categoryColor = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS['General']

  return (
    <motion.div
      key={goal.id}
      custom={index}
      variants={goalCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={cn(
        'group relative rounded-lg border border-gray-200/50 bg-white/60 backdrop-blur-sm p-3 transition-colors hover:bg-gray-50/80',
        goal.completed
          ? 'border-gray-200 bg-gray-50/60'
          : 'border-gray-200/50'
      )}
    >
      <div className="flex flex-col gap-2.5">
        {/* Top row: title, category, actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <button
              onClick={() => onToggleComplete(goal.id)}
              className="mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
              aria-label={goal.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {goal.completed ? (
                <CheckCircle2 className="h-5 w-5 text-gray-700" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400/50 hover:text-gray-500 transition-colors" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={cn(
                    'text-sm font-semibold leading-tight',
                    goal.completed && 'line-through text-gray-500'
                  )}
                >
                  {goal.title}
                </span>
                <Badge
                  variant="outline"
                  className={cn('text-[10px] px-1.5 py-0 shrink-0', categoryColor)}
                >
                  {goal.category}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(goal.id)}
            className="h-7 w-7 shrink-0 p-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
            aria-label="Delete goal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Description */}
        {goal.description && (
          <p
            className={cn(
              'text-xs leading-relaxed text-gray-600 pl-7',
              goal.completed && 'line-through'
            )}
          >
            {goal.description}
          </p>
        )}

        {/* Bottom row: deadline, progress */}
        <div className="flex items-center gap-3 pl-7">
          {/* Deadline */}
          <div className={cn('flex items-center gap-1 text-[11px] shrink-0', deadlineColor)}>
            <Calendar className="h-3 w-3" />
            <span className="font-medium">{formatDate(goal.deadline)}</span>
            <span className="text-gray-400">·</span>
            <Clock className="h-3 w-3" />
            <span className="font-medium">{deadlineLabel}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 pl-7">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn('h-full rounded-full', PROGRESS_COLORS[progressKey])}
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.6, delay: 0.1 * index, ease: 'easeOut' as const }}
            />
          </div>
          <span className="text-[11px] font-semibold text-gray-600 tabular-nums w-8 text-right">
            {goal.progress}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== EMPTY STATE ====================

function EmptyState() {
  return (
    <motion.div
      variants={emptyVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-3 py-8"
    >
      {/* Motivational illustration */}
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200">
          <Target className="h-8 w-8 text-gray-600" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-300">
          <Flag className="h-3 w-3 text-white" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-foreground">No goals yet</p>
        <p className="mt-1 max-w-[200px] text-xs text-gray-500">
          Set your first learning goal and start tracking your progress today!
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-600">
        <ArrowRight className="h-3 w-3" />
        <span>Click &quot;Add Goal&quot; to get started</span>
      </div>
    </motion.div>
  )
}
