'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Plus, BookOpen, TrendingUp, Compass } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

// ==================== TYPES ====================

interface UserSkill {
  skill: {
    id: string
    name: string
    category: string
  }
  proficiencyLevel: string
}

interface AllSkill {
  id: string
  name: string
  category: string
  description: string
  difficulty: string
}

interface Recommendation {
  skill: AllSkill
  reason: string
  reasonIcon: 'complement' | 'popular' | 'builds-on'
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

function ReasonIcon({ type }: { type: 'complement' | 'popular' | 'builds-on' }) {
  switch (type) {
    case 'complement':
      return <TrendingUp className="h-3 w-3" />
    case 'popular':
      return <Compass className="h-3 w-3" />
    case 'builds-on':
      return <BookOpen className="h-3 w-3" />
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

// ==================== REASON GENERATION ====================

function generateReason(
  skill: AllSkill,
  topCategories: string[],
  userSkillsByCategory: Record<string, string[]>
): { reason: string; reasonIcon: 'complement' | 'popular' | 'builds-on' } {
  const category = skill.category
  const isInTopCategory = topCategories.includes(category)

  if (isInTopCategory) {
    // Find a skill name from the user's skills in the same category to reference
    const categorySkills = userSkillsByCategory[category] || []
    if (categorySkills.length > 0) {
      const refSkill = categorySkills[0]
      return {
        reason: `Complements your ${refSkill} skills`,
        reasonIcon: 'complement',
      }
    }
    return {
      reason: `Popular in ${category}`,
      reasonIcon: 'popular',
    }
  }

  // Check if there's a related user skill in a nearby category
  const allUserSkillNames = Object.values(userSkillsByCategory).flat()
  if (allUserSkillNames.length > 0) {
    const refSkill = allUserSkillNames[0]
    return {
      reason: `Builds on your ${refSkill} knowledge`,
      reasonIcon: 'builds-on',
    }
  }

  return {
    reason: `Great next step for your learning journey`,
    reasonIcon: 'popular',
  }
}

// ==================== MAIN COMPONENT ====================

export function SkillRecommendationsPanel({ className }: SkillRecommendationsPanelProps) {
  const { user } = useAppStore()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const userId = user!.id
    async function fetchRecommendations() {
      setLoading(true)
      try {
        const [profileRes, skillsRes] = await Promise.all([
          fetch(`/api/profile?userId=${userId}`),
          fetch('/api/skills'),
        ])

        const profileData = await profileRes.json()
        const skillsData = await skillsRes.json()

        if (cancelled) return

        const userSkills: UserSkill[] = profileData.userSkills || []
        const allSkills: AllSkill[] = skillsData.skills || []

        // Skills the user already has
        const userSkillIds = new Set(userSkills.map((us) => us.skill.id))

        // Skills the user doesn't have
        const unownedSkills = allSkills.filter((s) => !userSkillIds.has(s.id))

        // Compute top categories from user skills
        const categoryCount: Record<string, number> = {}
        userSkills.forEach((us) => {
          const cat = us.skill.category
          categoryCount[cat] = (categoryCount[cat] || 0) + 1
        })
        const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])
        const topCategories = sortedCategories.slice(0, 3).map(([cat]) => cat)

        // Build user skills by category for reason generation
        const userSkillsByCategory: Record<string, string[]> = {}
        userSkills.forEach((us) => {
          const cat = us.skill.category
          if (!userSkillsByCategory[cat]) userSkillsByCategory[cat] = []
          userSkillsByCategory[cat].push(us.skill.name)
        })

        // Score and sort unowned skills
        const scored = unownedSkills.map((skill) => {
          let score = 0
          // Prioritize skills in top categories
          if (topCategories.includes(skill.category)) {
            const catIndex = topCategories.indexOf(skill.category)
            score += (3 - catIndex) * 10
          }
          // Slight preference for beginner difficulty if user is early
          if (skill.difficulty === 'beginner') score += 2
          if (skill.difficulty === 'intermediate') score += 1

          const { reason, reasonIcon } = generateReason(skill, topCategories, userSkillsByCategory)
          return { skill, reason, reasonIcon, score }
        })

        scored.sort((a, b) => b.score - a.score)
        const top8 = scored.slice(0, 8).map(({ skill, reason, reasonIcon }) => ({ skill, reason, reasonIcon }))

        setRecommendations(top8)
      } catch {
        setRecommendations([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRecommendations()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleAddToProfile = useCallback(async (skill: AllSkill) => {
    setAddedSkills((prev) => new Set(prev).add(skill.id))
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          targetGoal: 'Learn ' + skill.name,
          currentSkills: [{ skill: skill.name, level: 'beginner' }],
        }),
      })
      if (res.ok) {
        toast.success(`${skill.name} added to your profile!`)
      } else {
        setAddedSkills((prev) => { const n = new Set(prev); n.delete(skill.id); return n })
        toast.error('Failed to add skill. Try again.')
      }
    } catch {
      setAddedSkills((prev) => { const n = new Set(prev); n.delete(skill.id); return n })
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
              <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                {recommendations.length} skills
              </Badge>
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
                  const isAdded = addedSkills.has(rec.skill.id)
                  const categoryColor = CATEGORY_COLORS[rec.skill.category] || 'bg-gray-100 text-gray-600 border-gray-300'
                  const difficultyKey = (rec.skill.difficulty || 'beginner').toLowerCase()
                  const difficultyColor = DIFFICULTY_COLORS[difficultyKey] || DIFFICULTY_COLORS.beginner

                  return (
                    <motion.div
                      key={rec.skill.id}
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
                            {rec.skill.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 leading-4', categoryColor)}
                          >
                            {rec.skill.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 leading-4', difficultyColor)}
                          >
                            {rec.skill.difficulty}
                          </Badge>
                        </div>
                      </div>

                      {/* Reason text */}
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
                          onClick={() => handleAddToProfile(rec.skill)}
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
