'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookMarked,
  FileText,
  GraduationCap,
  PlayCircle,
  Wrench,
  Star,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ==================== TYPES ====================
type ResourceType = 'documentation' | 'tutorial' | 'video' | 'tool'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'

type LearningResource = {
  id: string
  title: string
  description: string
  type: ResourceType
  url: string
  author: string
  duration: string
  bookmarked: boolean
  tags: string[]
  difficulty: Difficulty
  rating: number
}

// ==================== HELPERS ====================

function formatDuration(estimatedHours: number | null | undefined): string {
  if (!estimatedHours || estimatedHours <= 0) return 'Self-paced'
  const h = Math.floor(estimatedHours)
  const m = Math.round((estimatedHours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function mapResourceType(rawType: string | null | undefined): ResourceType {
  if (!rawType) return 'tool'
  if (rawType === 'course') return 'tutorial'
  if (rawType === 'tutorial') return 'tutorial'
  if (rawType === 'video') return 'video'
  if (rawType === 'documentation' || rawType === 'article' || rawType === 'book') return 'documentation'
  return 'tool'
}

function extractTags(title: string, description: string): string[] {
  const text = `${title} ${description}`
  const tags: string[] = []
  const knownTags = ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Python', 'Rust', 'CSS', 'HTML', 'Node.js', 'GraphQL', 'REST', 'API', 'Docker', 'DevOps', 'Git', 'ML', 'AI', 'Frontend', 'Backend', 'Database', 'Testing', 'Architecture', 'Security', 'Performance', 'Cloud', 'AWS', 'Vue', 'Angular', 'Svelte', 'Tailwind', 'PostgreSQL', 'MongoDB', 'Redis']
  for (const tag of knownTags) {
    if (text.includes(tag)) {
      tags.push(tag)
      if (tags.length >= 3) break
    }
  }
  return tags
}


// ==================== LOADING SKELETON ====================

function ResourceSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/50 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== CONFIG ====================
const typeFilters: { value: ResourceType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'documentation', label: 'Docs' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'video', label: 'Video' },
  { value: 'tool', label: 'Tool' },
]

const typeIconMap: Record<ResourceType, React.ComponentType<{ className?: string }>> = {
  documentation: FileText,
  tutorial: GraduationCap,
  video: PlayCircle,
  tool: Wrench,
}

const typeColorMap: Record<ResourceType, string> = {
  documentation: 'bg-gray-100 text-gray-700',
  tutorial: 'bg-gray-100 text-gray-700',
  video: 'bg-gray-100 text-gray-700',
  tool: 'bg-gray-100 text-gray-700',
}

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  beginner: {
    label: 'Beginner',
    className: 'bg-neutral-100 text-neutral-900 border-neutral-200 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-200',
  },
  intermediate: {
    label: 'Intermediate',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  advanced: {
    label: 'Advanced',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
}

// ==================== STAR RATING ====================
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < rating
              ? 'text-gray-500 fill-gray-500'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

// ==================== RESOURCE CARD ====================
function ResourceCard({
  resource,
  onToggleBookmark,
}: {
  resource: LearningResource
  onToggleBookmark: (id: string) => void
}) {
  const TypeIcon = typeIconMap[resource.type]
  const diffConfig = difficultyConfig[resource.difficulty]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Card className="group h-full transition-all duration-200 hover:shadow-md hover:border-neutral-200 dark:hover:border-neutral-200">
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Top row: Type icon + Title + Actions */}
          <div className="flex items-start gap-2.5">
            <div
              className={`h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center ${typeColorMap[resource.type]}`}
            >
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold leading-tight truncate">
                {resource.title}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                by {resource.author}
              </p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onToggleBookmark(resource.id)}
                aria-label={resource.bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {resource.bookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-neutral-900" />
                ) : (
                  <Bookmark className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                asChild
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${resource.title}`}
                >
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-neutral-900 transition-colors" />
                </a>
              </Button>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 font-medium"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Bottom row: Difficulty + Duration + Rating */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold px-2 py-0 h-5 border ${diffConfig.className}`}
            >
              {diffConfig.label}
            </Badge>
            <span className="text-[10px] text-gray-500">
              {resource.duration}
            </span>
            <StarRating rating={resource.rating} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ==================== EMPTY STATE ====================
function EmptyState({ query, hasBookmarksOnly, totalResources }: { query: string; hasBookmarksOnly: boolean; totalResources: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">
        {totalResources === 0
          ? 'No resources available yet'
          : hasBookmarksOnly
          ? 'No bookmarked resources found'
          : 'No resources match your search'}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {totalResources === 0
          ? 'Resources will appear as your roadmap progresses'
          : query
          ? `Try adjusting your search for "${query}"`
          : 'Try a different filter or clear your search'}
      </p>
    </motion.div>
  )
}

// ==================== MAIN COMPONENT ====================
export function ResourceLibraryPanel({ className }: { className?: string }) {
  const { user } = useAppStore()
  const mounted = useIsMounted()
  const [resources, setResources] = useState<LearningResource[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<ResourceType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)

  useEffect(() => {
    if (!mounted || !user?.id) return
    let cancelled = false
    fetch(`/api/resources?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const rawResources = (data.resources || []) as Array<Record<string, unknown>>
        const ids: string[] = (data.bookmarkedIds || []) as string[]
        setBookmarkedIds(new Set(ids))
        const mapped: LearningResource[] = rawResources.map((r) => ({
          id: r.id as string,
          title: (r.title as string) || '',
          description: (r.description as string) || '',
          url: (r.url as string) || '#',
          type: mapResourceType(r.type as string),
          difficulty: (['beginner', 'intermediate', 'advanced'].includes(r.difficulty as string) ? r.difficulty : 'beginner') as Difficulty,
          duration: formatDuration(r.estimatedHours as number | null),
          rating: Math.round(r.qualityScore as number) || 0,
          tags: extractTags((r.title as string) || '', (r.description as string) || ''),
          bookmarked: ids.includes(r.id as string),
          author: 'Study Buddies Curated',
        }))
        setResources(mapped)
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [mounted, user?.id])

  const bookmarkedCount = resources.filter((r) => r.bookmarked).length

  const filteredResources = useMemo(() => {
    let result = resources

    // Filter by type
    if (activeType !== 'all') {
      result = result.filter((r) => r.type === activeType)
    }

    // Filter by bookmarks
    if (showBookmarkedOnly) {
      result = result.filter((r) => r.bookmarked)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.tags || []).some((tag: string) => (tag || '').toLowerCase().includes(q))
      )
    }

    return result
  }, [resources, activeType, searchQuery, showBookmarkedOnly])

  const handleToggleBookmark = (id: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, bookmarked: !r.bookmarked } : r))
    )
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center shadow-sm">
              <BookMarked className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Resource Library
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {resources.length} resources curated for you
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <BookMarked className="h-3.5 w-3.5 text-neutral-900" />
            <span className="text-xs font-medium text-gray-500">
              {bookmarkedCount}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Search + Filter Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button
            variant={showBookmarkedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowBookmarkedOnly((prev) => !prev)}
            className={`h-9 gap-1.5 shrink-0 ${
              showBookmarkedOnly
                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                : ''
            }`}
          >
            <BookmarkCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bookmarked</span>
            <span>({bookmarkedCount})</span>
          </Button>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1">
          <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          {typeFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeType === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveType(filter.value)}
              className={`h-7 text-xs px-3 shrink-0 ${
                activeType === filter.value
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                  : ''
              }`}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Resources Grid / List */}
        <ScrollArea className="max-h-[520px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <ResourceSkeleton />
            ) : filteredResources.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={`${activeType}-${showBookmarkedOnly}-${searchQuery}`}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {filteredResources.map((resource) => (
                  <motion.div key={resource.id} variants={itemVariants}>
                    <ResourceCard
                      resource={resource}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState
                query={searchQuery}
                hasBookmarksOnly={showBookmarkedOnly}
                totalResources={resources.length}
              />
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
