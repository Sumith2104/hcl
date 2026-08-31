'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Plus, BookOpen, TrendingUp, Compass, Zap, Target, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

// ==================== TYPES ====================

interface MLSkillRecommendation {
  skillId: string
  skillName: string
  category: string
  difficulty: string
  reason: string
  reasonIcon: 'complement' | 'trending' | 'career-boost' | 'builds-on' | 'foundation'
  matchScore: number
}

interface SkillRecommendationsPanelProps {
  className?: string
}

// ==================== CATEGORY COLOR MAPPING ====================

const CATEGORY_COLORS: Record<string, string> = {
  Frontend: 'bg-gray-100 text-gray-600 border-gray-300',
  Backend: 'bg-gray-100 text-gray-600 border-gray-300',
  'AI/ML': 'bg-gray-100 text-gray-600 border-gray-300',
  'Data Science': 'bg-gray-100 text-gray-600 border-gray-300',
  DevOps: 'bg-gray-100 text-gray-600 border-gray-300',
  Mobile: 'bg-gray-100 text-gray-600 border-gray-300',
  Security: 'bg-gray-100 text-gray-600 border-gray-300',
  'System Design': 'bg-gray-100 text-gray-600 border-gray-300',
  'Soft Skills': 'bg-gray-100 text-gray-600 border-gray-300',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-gray-100 text-gray-600 border-gray-300',
  intermediate: 'bg-gray-100 text-gray-600 border-gray-300',
  advanced: 'bg-gray-100 text-gray-600 border-gray-300',
}

// ==================== REASON ICON COMPONENT ====================

function ReasonIcon({ type }: { type: string }) {
  switch (type) {
    case 'complement': return <TrendingUp className="h-3 w-3" />
    case 'trending': return <Zap className="h-3 w-3" />
    case 'career-boost': return <Target className="h-3 w-3" />
    case 'builds-on': return <Layers className="h-3 w-3" />
    case 'foundation': return <BookOpen className="h-3 w-3" />
    default: return <Compass className="h-3 w-3" />
  }
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

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' as const },
  }),
}

// ==================== SKELETON COMPONENT ====================

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-border/50 p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-44" />
          <div className="flex justify-end">
            <Skeleton className="h-7 w-28 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== EMPTY STATE ====================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
        <Sparkles className="h-5 w-5 text-gray-600" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">All caught up!</p>
      <p className="mt-1 max-w-[200px] text-xs text-gray-500">
        You&apos;ve explored all available skills. Check back later for new ones.
      </p>
    </div>
  )
}
// ==================== ML BADGE ====================

function MLBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-gray-300 bg-gray-50 text-gray-600"
    >
      <Zap className="h-3 w-3" />
      AI-Powered
    </Badge>
  )
}

// ==================== MAIN COMPONENT ====================

export function SkillRecommendationsPanel({ className }: SkillRecommendationsPanelProps) {
  const { user } = useAppStore()
  const [recommendations, setRecommendations] = useState<MLSkillRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function fetchMLRecommendations() {
      setLoading(true)
      try {
        // Fetch profile for ML context
        const profileRes = await fetch(`/api/profile?userId=${user!.id}`)
        const profileData = await profileRes.json()
        const profile = profileData.profile

        if (cancelled) return

        // Call ML recommendations API
        const mlRes = await fetch('/api/ml/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user!.id,
            goal: profile?.targetGoal || 'Full Stack Developer',
            experienceLevel: profile?.experienceLevel || 'beginner',
            learningStyle: profile?.preferredLearningStyle || 'mixed',
            maxRecommendations: 8,
          }),
        })
        const mlData = await mlRes.json()

        if (cancelled) return

        if (mlData.recommendations && mlData.recommendations.length > 0) {
          setRecommendations(mlData.recommendations)
        } else {
          // Fallback to simple API-based recommendations
          setRecommendations([])
        }
      } catch {
        setRecommendations([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMLRecommendations()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleAddToProfile = useCallback(async (skill: MLSkillRecommendation) => {
    setAddedSkills((prev) => new Set(prev).add(skill.skillId))
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          targetGoal: 'Learn ' + skill.skillName,
          currentSkills: [{ skill: skill.skillName, level: 'beginner' }],
        }),
      })
      if (res.ok) {
        toast.success(`${skill.skillName} added to your profile!`)
      } else {
        setAddedSkills((prev) => { const n = new Set(prev); n.delete(skill.skillId); return n })
        toast.error('Failed to add skill. Try again.')
      }
    } catch {
      setAddedSkills((prev) => { const n = new Set(prev); n.delete(skill.skillId); return n })
      toast.error('Failed to add skill. Try again.')
    }
  }, [user])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200">
              <Sparkles className="h-4.5 w-4.5 text-gray-600" />
            </div>
            <CardTitle className="text-base">Recommended For You</CardTitle>
          </div>
          <CardAction>
            {!loading && recommendations.length > 0 && (
              <div className="flex items-center gap-2">
                <MLBadge />
                <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                  {recommendations.length} skills
                </Badge>
              </div>
            )}
          </CardAction>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <LoadingSkeleton />
          ) : recommendations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="max-h-80 overflow-y-auto pr-1">
              <div className="flex flex-col gap-2.5">
                {recommendations.map((rec, i) => {
                  const isAdded = addedSkills.has(rec.skillId)
                  const categoryColor = CATEGORY_COLORS[rec.category] || 'bg-gray-100 text-gray-600 border-gray-300'
                  const difficultyKey = (rec.difficulty || 'beginner').toLowerCase()
                  const difficultyColor = DIFFICULTY_COLORS[difficultyKey] || DIFFICULTY_COLORS.beginner

                  return (
                    <motion.div
                      key={rec.skillId}
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className={cn(
                        'rounded-lg border border-gray-200/60 bg-white/40 backdrop-blur-sm p-3 transition-colors hover:bg-gray-50/60',
                        isAdded && 'border-gray-300/60 bg-gray-100/50'
                      )}
                    >
                      {/* Skill name + badges row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground">
                            {rec.skillName}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 leading-4', categoryColor)}
                          >
                            {rec.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 leading-4', difficultyColor)}
                          >
                            {rec.difficulty}
                          </Badge>
                          {/* ML match score indicator */}
                          {rec.matchScore > 0 && (
                            <span className="text-[10px] text-gray-400">
                              {Math.round(rec.matchScore * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ML-generated reason text */}
                      <div className="mt-1.5 flex items-center gap-1.5 text-gray-600">
                        <ReasonIcon type={rec.reasonIcon} />
                        <span className="text-xs">{rec.reason}</span>
                      </div>

                      {/* Add to profile button */}
                      <div className="mt-2.5 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          disabled={isAdded}
                          onClick={() => handleAddToProfile(rec)}
                        >
                          {isAdded ? (
                            <>
                              <Sparkles className="h-3 w-3 text-gray-600" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              Add to Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
