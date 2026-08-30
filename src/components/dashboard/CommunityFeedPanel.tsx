'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { useIsMounted } from '@/hooks/use-is-mounted'
import {
  Heart, MessageCircle, Bookmark, Search, Plus,
  Award, Lightbulb, BookMarked, Flame, HelpCircle,
  CheckCircle, TrendingUp, X, Send, Loader2, Clock, BookOpen,
} from 'lucide-react'

// ==================== TYPES ====================
type FeedType = 'achievement' | 'tip' | 'resource' | 'milestone' | 'question' | 'progress'
type FilterTab = 'all' | 'achievement' | 'tip' | 'question' | 'milestone'

type Category = 'Frontend' | 'Backend' | 'AI/ML' | 'DevOps' | 'Design' | 'Mobile'

interface FeedItem {
  id: string
  type: FeedType
  author: string
  initials: string
  avatarColor: string
  timestamp: string
  content: string
  category: Category
  likes: number
  comments: number
  bookmarks: number
}

interface CommunityFeedPanelProps {
  className?: string
}

// ==================== CONFIG ====================
const feedTypeConfig: Record<FeedType, { icon: typeof Award; label: string; color: string; bg: string }> = {
  achievement: { icon: Award, label: 'Achievement', color: 'text-gray-700', bg: 'bg-gray-100' },
  tip: { icon: Lightbulb, label: 'Tip', color: 'text-gray-700', bg: 'bg-gray-100' },
  resource: { icon: BookMarked, label: 'Resource', color: 'text-gray-700', bg: 'bg-gray-100' },
  milestone: { icon: Flame, label: 'Milestone', color: 'text-gray-600', bg: 'bg-gray-100' },
  question: { icon: HelpCircle, label: 'Question', color: 'text-gray-600', bg: 'bg-gray-100' },
  progress: { icon: CheckCircle, label: 'Progress', color: 'text-gray-600', bg: 'bg-gray-100' },
}

const categoryColors: Record<Category, string> = {
  Frontend: 'bg-gray-100 text-gray-700',
  Backend: 'bg-gray-100 text-gray-700',
  'AI/ML': 'bg-gray-100 text-gray-700',
  DevOps: 'bg-gray-100 text-gray-700',
  Design: 'bg-gray-100 text-gray-700',
  Mobile: 'bg-gray-100 text-gray-700',
}

const avatarColors = [
  'bg-gray-200',
  'bg-gray-200',
  'bg-gray-300',
  'bg-gray-300',
  'bg-gray-300',
  'bg-gray-400',
  'bg-gray-400',
  'bg-gray-400',
  'bg-gray-500',
  'bg-gray-500',
  'bg-gray-500',
  'bg-gray-200',
]

const learningTips = [
  'Use active recall instead of passive re-reading — test yourself on what you just learned.',
  'The Pomodoro technique (25 min focus + 5 min break) boosts retention significantly.',
  'Teaching a concept to someone else is the fastest way to solidify your understanding.',
  'Spaced repetition beats cramming every time. Review at increasing intervals.',
  'Build projects alongside tutorials — muscle memory comes from doing, not watching.',
]

// ==================== HELPERS ====================
function timeAgo(dateStr: string): string {
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ==================== ANIMATION CONFIG ====================
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06 as const,
      delayChildren: 0.05 as const,
    },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const heartBounce = {
  scale: [1, 1.35, 0.9, 1.15, 1] as const,
  transition: { duration: 0.4, ease: 'easeOut' as const },
}

// ==================== FEED CARD ====================
function FeedCard({ item, onLike, onBookmark }: {
  item: FeedItem
  onLike: (id: string) => void
  onBookmark: (id: string) => void
}) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [heartAnimating, setHeartAnimating] = useState(false)
  const typeConfig = feedTypeConfig[item.type]
  const TypeIcon = typeConfig.icon

  const handleLike = () => {
    setLiked(!liked)
    setHeartAnimating(true)
    onLike(item.id)
    setTimeout(() => setHeartAnimating(false), 400)
  }

  const handleBookmark = () => {
    setBookmarked(!bookmarked)
    onBookmark(item.id)
    toast.success(bookmarked ? 'Bookmark removed' : 'Post bookmarked')
  }

  const likeCount = liked ? item.likes + 1 : item.likes
  const bookmarkCount = bookmarked ? item.bookmarks + 1 : item.bookmarks

  return (
    <motion.div
      variants={cardVariant}
      layout
      className="glass-card rounded-xl p-4 hover-lift transition-colors"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold shrink-0',
          item.avatarColor,
        )}>
          {item.initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{item.author}</span>
            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center', typeConfig.bg)}>
              <TypeIcon className={cn('w-3 h-3', typeConfig.color)} />
            </div>
            <span className="text-xs text-gray-500">{item.timestamp}</span>
          </div>

          {/* Category badge */}
          <div className="mt-1.5">
            <Badge variant="secondary" className={cn('text-[10px] px-2 py-0 h-5 font-medium border-0', categoryColors[item.category])}>
              {item.category}
            </Badge>
          </div>

          {/* Text content */}
          <p className="mt-2 text-sm text-foreground/90 leading-relaxed line-clamp-3">
            {item.content}
          </p>

          {/* Engagement row */}
          <div className="flex items-center gap-4 mt-3">
            {/* Like button */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 group"
              aria-label="Like this post"
            >
              <motion.span
                animate={heartAnimating ? heartBounce : { scale: 1 }}
                className="inline-flex"
              >
                <Heart className={cn(
                  'w-4 h-4 transition-colors',
                  liked ? 'fill-gray-500 text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                )} />
              </motion.span>
              <span className={cn('text-xs font-medium', liked ? 'text-gray-600' : 'text-gray-400')}>
                {likeCount}
              </span>
            </button>

            {/* Comments */}
            <button className="flex items-center gap-1.5 group" aria-label="View comments">
              <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              <span className="text-xs font-medium text-gray-400">{item.comments}</span>
            </button>

            {/* Bookmark button */}
            <button
              onClick={handleBookmark}
              className="flex items-center gap-1.5 group"
              aria-label="Bookmark this post"
            >
              <Bookmark className={cn(
                'w-4 h-4 transition-colors',
                bookmarked ? 'fill-gray-500 text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
              )} />
              <span className={cn('text-xs font-medium', bookmarked ? 'text-gray-600' : 'text-gray-400')}>
                {bookmarkCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== TRENDING SIDEBAR ====================
function TrendingSidebar({ topics }: { topics: { tag: string; count: number }[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-foreground">Trending Topics</h3>
      </div>
      <div className="space-y-2">
        {topics.length > 0 ? topics.map((topic, i) => (
          <motion.div
            key={topic.tag}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.06, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 w-4 text-center">{i + 1}</span>
              <span className="text-sm font-medium text-foreground">{topic.tag}</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">{topic.count} posts</span>
          </motion.div>
        )) : (
          <p className="text-xs text-gray-500 text-center py-4">No trending topics yet</p>
        )}
      </div>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================
export function CommunityFeedPanel({ className }: CommunityFeedPanelProps) {
  const user = useAppStore((s) => s.user)
  const userId = user?.id
  const mounted = useIsMounted()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [composeText, setComposeText] = useState('')
  const [userPosts, setUserPosts] = useState<FeedItem[]>([])
  const [activityItems, setActivityItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real user activity to build feed
  useEffect(() => {
    if (!mounted || !userId) return

    const userName = user?.name || 'You'
    const userInitials = getUserInitials(userName)
    const userColor = avatarColors[1]
    let items: FeedItem[] = []

    Promise.all([
      fetch(`/api/study-sessions?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => ({ sessions: [] })),
      fetch(`/api/achievements?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => ({ earnedAchievements: [] })),
    ]).then(([sessionsData, achievementsData]) => {
      // Convert study sessions to feed items
      const sessions = (sessionsData.sessions || []).slice(0, 10) as Array<Record<string, unknown>>
      for (const s of sessions) {
        const duration = (s.duration as number) || 0
        const skillName = (s.skillName as string) || 'General'
        const mins = Math.round(duration / 60)
        items.push({
          id: `session-${s.id}`,
          type: 'progress',
          author: userName,
          initials: userInitials,
          avatarColor: userColor,
          timestamp: timeAgo(s.createdAt as string),
          content: `Completed a ${mins > 0 ? `${mins}-minute` : 'focus'} study session${skillName !== 'General' ? ` on ${skillName}` : ''}.${s.notes ? ` ${s.notes}` : ''}`,
          category: 'Frontend' as Category,
          likes: 0,
          comments: 0,
          bookmarks: 0,
        })
      }

      // Convert achievements to feed items
      const achievements = (achievementsData.earnedAchievements || []).slice(0, 10) as Array<Record<string, unknown>>
      const ACHIEVEMENTS: Record<string, string> = {
        'first-steps': 'Completed profile setup',
        'path-finder': 'Generated first learning roadmap',
        'knowledge-seeker': 'Completed 5 roadmap items',
        'week-warrior': 'Maintained a 7-day learning streak',
        'chat-initiate': 'Had first AI assistant conversation',
        'skill-collector': 'Added 10 skills to profile',
        'phase-champion': 'Completed an entire learning phase',
        'road-scholar': 'Completed 50% of the roadmap',
        'double-digit': 'Reached a 10-day learning streak',
        'mentors-pet': 'Asked the AI 20 questions',
        'completionist': 'Completed 100% of the roadmap',
        'path-master': 'Completed roadmap with 5+ skills',
      }
      for (const a of achievements) {
        const achId = a.achievementId as string
        items.push({
          id: `ach-${a.id}`,
          type: 'achievement',
          author: userName,
          initials: userInitials,
          avatarColor: userColor,
          timestamp: timeAgo(a.earnedAt as string),
          content: `Earned the "${achId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}" achievement! ${ACHIEVEMENTS[achId] || 'Keep up the great work!'}`,
          category: 'Frontend' as Category,
          likes: 0,
          comments: 0,
          bookmarks: 0,
        })
      }

      // Sort by date (most recent first) and take top 20
      items.sort((a, b) => {
        // We can't easily re-sort by timestamp strings, so just use the original order
        return 0
      })

      setActivityItems(items.slice(0, 20))
      setLoading(false)
    })
  }, [mounted, userId, user?.name])

  // Compute trending topics from activity
  const trendingTopics = useMemo(() => {
 const skillCounts = new Map<string, number>()
    for (const item of [...activityItems, ...userPosts]) {
      if (item.category) {
        skillCounts.set(item.category, (skillCounts.get(item.category) || 0) + 1)
      }
    }
    return Array.from(skillCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [activityItems, userPosts])

  const allItems = useMemo(() => [...userPosts, ...activityItems], [userPosts, activityItems])

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesTab = activeTab === 'all' || item.type === activeTab
      const matchesSearch = searchQuery === '' ||
        (item.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.author || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [allItems, activeTab, searchQuery])

  const handleLike = (_id: string) => {
    // Visual-only like toggle — counts update via local state in FeedCard
  }

  const handleBookmark = (_id: string) => {
    // Visual-only bookmark toggle
  }

  const handleCompose = () => {
    if (!composeText.trim()) {
      toast.error('Please write something before sharing')
      return
    }
    const newPost: FeedItem = {
      id: `user-${Date.now()}`,
      type: 'progress',
      author: user?.name || 'You',
      initials: getUserInitials(user?.name || 'You'),
      avatarColor: avatarColors[1],
      timestamp: 'Just now',
      content: composeText.trim(),
      category: 'Frontend' as Category,
      likes: 0,
      comments: 0,
      bookmarks: 0,
    }
    setUserPosts((prev) => [newPost, ...prev])
    setComposeText('')
    setDialogOpen(false)
    toast.success('Your update has been shared!')
  }

  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = { all: allItems.length, achievement: 0, tip: 0, question: 0, milestone: 0 }
    allItems.forEach((item) => {
      if (item.type in counts) {
        counts[item.type as keyof typeof counts]++
      }
    })
    return counts
  }, [allItems])

  return (
    <Card className={cn('glass-card-hover', className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-gray-700" />
            </div>
            <CardTitle className="text-base">Your Activity Feed</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Share Update</span>
                <span className="sm:hidden">Share</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-gray-700" />
                  Share Your Update
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Textarea
                  placeholder="What are you learning today? Share a tip, achievement, or question..."
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Your post will appear at the top of your activity feed.
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => { setDialogOpen(false); setComposeText('') }}>
                  Cancel
                </Button>
                <Button onClick={handleCompose} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 gap-1.5">
                  <Send className="w-4 h-4" />
                  Post
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Tab filters */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="h-9 w-full justify-start flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="all" className="text-xs h-7 px-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              All <span className="ml-1.5 text-[10px] opacity-70">{tabCounts.all}</span>
            </TabsTrigger>
            <TabsTrigger value="achievement" className="text-xs h-7 px-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              Achievements <span className="ml-1.5 text-[10px] opacity-70">{tabCounts.achievement}</span>
            </TabsTrigger>
            <TabsTrigger value="tip" className="text-xs h-7 px-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              Tips <span className="ml-1.5 text-[10px] opacity-70">{tabCounts.tip}</span>
            </TabsTrigger>
            <TabsTrigger value="question" className="text-xs h-7 px-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              Questions <span className="ml-1.5 text-[10px] opacity-70">{tabCounts.question}</span>
            </TabsTrigger>
            <TabsTrigger value="milestone" className="text-xs h-7 px-3 data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              Milestones <span className="ml-1.5 text-[10px] opacity-70">{tabCounts.milestone}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Two-column layout: feed + sidebar */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Feed column */}
          <div className="flex-1 min-w-0">
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeTab + searchQuery}
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                  >
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <FeedCard
                          key={item.id}
                          item={item}
                          onLike={handleLike}
                          onBookmark={handleBookmark}
                        />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No activity yet</p>
                        <p className="text-xs text-gray-400 mt-1">Start learning and your activity will appear here!</p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Trending sidebar (desktop only) */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-0">
              <TrendingSidebar topics={trendingTopics} />
            </div>
          </div>
        </div>

        {/* Mobile trending (collapsed) */}
        <div className="lg:hidden">
          <TrendingSidebar topics={trendingTopics} />
        </div>
      </CardContent>
    </Card>
  )
}
