'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { useAppStore } from '@/store'
import { motion } from 'framer-motion'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitBranch,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

// ==================== TYPES ====================

type ProficiencyStatus = 'not-started' | 'in-progress' | 'completed'

type CategoryName =
  | 'Frontend'
  | 'Backend'
  | 'Data Science'
  | 'DevOps'
  | 'AI/ML'
  | 'System Design'

interface SkillNode {
  id: string
  name: string
  category: CategoryName
  proficiency: ProficiencyStatus
  x: number
  y: number
  description: string
  level: number
}

interface Edge {
  from: string
  to: string
}

interface SkillTreeVisualizationProps {
  className?: string
}

// ==================== CONSTANTS ====================

const CANVAS_W = 2400
const CANVAS_H = 1800
const NODE_W = 148
const NODE_H = 58
const NODE_W_MOBILE = 110
const NODE_H_MOBILE = 44
const MIN_ZOOM = 0.15
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.15

const CATEGORY_CONFIG: Record<
  CategoryName,
  { color: string; bg: string; border: string; glow: string; text: string; dot: string; cluster: string }
> = {
  Frontend: {
    color: '#374151',
    bg: 'bg-gray-100/60',
    border: 'border-gray-200/60',
    glow: 'shadow-gray-200/40',
    text: 'text-gray-700',
    dot: 'fill-gray-500',
    cluster: 'rgba(209,213,219,0.15)',
  },
  Backend: {
    color: '#6b7280',
    bg: 'bg-gray-100/60',
    border: 'border-gray-200/60',
    glow: 'shadow-gray-200/40',
    text: 'text-gray-600',
    dot: 'fill-gray-500',
    cluster: 'rgba(209,213,219,0.15)',
  },
  'Data Science': {
    color: '#4b5563',
    bg: 'bg-gray-100/60',
    border: 'border-gray-200/60',
    glow: 'shadow-gray-200/40',
    text: 'text-gray-600',
    dot: 'fill-gray-500',
    cluster: 'rgba(209,213,219,0.15)',
  },
  DevOps: {
    color: '#6b7280',
    bg: 'bg-gray-100/60',
    border: 'border-gray-200/60',
    glow: 'shadow-gray-200/40',
    text: 'text-gray-600',
    dot: 'fill-gray-500',
    cluster: 'rgba(209,213,219,0.15)',
  },
  'AI/ML': {
    color: '#374151',
    bg: 'bg-gray-100/60',
    border: 'border-gray-200/60',
    glow: 'shadow-gray-200/40',
    text: 'text-gray-700',
    dot: 'fill-gray-500',
    cluster: 'rgba(209,213,219,0.15)',
  },
  'System Design': {
    color: '#4b5563',
    bg: 'bg-gray-100/60',
    border: 'border-gray-200/60',
    glow: 'shadow-gray-200/40',
    text: 'text-gray-600',
    dot: 'fill-gray-500',
    cluster: 'rgba(209,213,219,0.15)',
  },
}

const ALL_CATEGORIES: CategoryName[] = [
  'Frontend',
  'Backend',
  'Data Science',
  'DevOps',
  'AI/ML',
  'System Design',
]

const PROFICIENCY_RING: Record<ProficiencyStatus, string> = {
  'not-started': 'stroke-gray-200',
  'in-progress': 'stroke-gray-400',
  completed: 'stroke-gray-700',
}

const PROFICIENCY_LABEL: Record<ProficiencyStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

// ==================== HELPERS ====================

function getBezierPath(fromNode: SkillNode, toNode: SkillNode): string {
  const nw = NODE_W
  const nh = NODE_H
  const x1 = fromNode.x + nw / 2
  const y1 = fromNode.y + nh
  const x2 = toNode.x + nw / 2
  const y2 = toNode.y
  const midY = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
}

// ==================== ANIMATION VARIANTS ====================

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.6 } as const,
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.025,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }) as const,
}

const edgeVariants = {
  hidden: { pathLength: 0, opacity: 0 } as const,
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 0.5,
    transition: {
      delay: i * 0.018,
      duration: 0.7,
      ease: 'easeOut' as const,
    },
  }) as const,
}

// ==================== COMPONENT ====================

export function SkillTreeVisualization({ className }: SkillTreeVisualizationProps) {
  const { user } = useAppStore()
  const isMounted = useIsMounted()
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.55)
  const [pan, setPan] = useState({ x: 60, y: 40 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [hiddenCategories, setHiddenCategories] = useState<Set<CategoryName>>(new Set())
  const [focusMode, setFocusMode] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [SKILLS, setSKILLS] = useState<SkillNode[]>([])
  const [EDGES, setEDGES] = useState<Edge[]>([])
  const [LEARNING_PATH_IDS, setLearningPathIds] = useState<Set<string>>(new Set())
  const [isLoadingTree, setIsLoadingTree] = useState(true)

  // Fetch skill tree from API
  useEffect(() => {
    if (!isMounted || !user) return
    fetch(`/api/skill-tree?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        const apiSkills = data.skills || []
        const apiEdges = data.edges || []
        const roadmapIds: string[] = data.roadmapItemIds || []

        // Proficiency mapping
        const profMap: Record<string, ProficiencyStatus> = {
          none: 'not-started',
          beginner: 'in-progress',
          intermediate: 'in-progress',
          advanced: 'completed',
          expert: 'completed',
        }

        // Group by category and compute positions
        const categoryGroups = new Map<CategoryName, typeof apiSkills>()
        for (const cat of ALL_CATEGORIES) {
          categoryGroups.set(cat, [])
        }
        for (const s of apiSkills) {
          const cat = (ALL_CATEGORIES.includes(s.category as CategoryName)
            ? s.category
            : ALL_CATEGORIES[0]) as CategoryName
          if (!categoryGroups.has(cat)) categoryGroups.set(cat, [])
          categoryGroups.get(cat)!.push(s)
        }

        const nodes: SkillNode[] = []
        const categoryOrder = ALL_CATEGORIES.filter(c => (categoryGroups.get(c) || []).length > 0)
        const categoryXStart = 120
        const categoryXSpacing = 380
        const rowYStart = 80
        const rowYSpacing = 110
        const nodeXSpacing = 180
        let globalLevel = 0

        for (const cat of categoryOrder) {
          const catSkills = categoryGroups.get(cat) || []
          const catIdx = categoryOrder.indexOf(cat)
          const baseX = categoryXStart + catIdx * categoryXSpacing

          for (let i = 0; i < catSkills.length; i++) {
            const s = catSkills[i]
            const level = globalLevel
            nodes.push({
              id: s.id,
              name: s.name,
              category: cat,
              proficiency: profMap[s.proficiency] || 'not-started',
              x: baseX + (i % 2) * nodeXSpacing,
              y: rowYStart + Math.floor(i / 2) * rowYSpacing,
              description: s.description || '',
              level,
            })
            globalLevel++
          }
        }

        setSKILLS(nodes)
        setEDGES(apiEdges.map((e: Record<string, unknown>) => ({
          from: e.from as string,
          to: e.to as string,
        })))
        setLearningPathIds(new Set(roadmapIds))
      })
      .catch(() => { /* silent */ })
      .finally(() => setIsLoadingTree(false))
  }, [isMounted, user])

  // Build skillMap from skills state
  const skillMap = useMemo(
    () => Object.fromEntries(SKILLS.map((s) => [s.id, s])),
    [SKILLS]
  )

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Filter skills by category
  const visibleSkills = useMemo(
    () => SKILLS.filter((s) => !hiddenCategories.has(s.category)),
    [SKILLS, hiddenCategories]
  )

  const visibleSkillIds = useMemo(
    () => new Set(visibleSkills.map((s) => s.id)),
    [visibleSkills]
  )

  // Filter edges (both endpoints visible)
  const visibleEdges = useMemo(
    () => EDGES.filter((e) => visibleSkillIds.has(e.from) && visibleSkillIds.has(e.to)),
    [EDGES, visibleSkillIds]
  )

  // Search highlight
  const searchLower = searchQuery.toLowerCase().trim()
  const highlightedIds = useMemo(() => {
    if (!searchLower) return new Set<string>()
    return new Set(
      SKILLS.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.category.toLowerCase().includes(searchLower)
      ).map((s) => s.id)
    )
  }, [searchLower, SKILLS])

  const isSearchActive = highlightedIds.size > 0

  // Zoom handlers
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      setZoom((prev) => {
        const next = prev - e.deltaY * 0.001
        return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
      })
    },
    []
  )

  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP)), [])
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP)), [])
  const resetView = useCallback(() => {
    setZoom(0.55)
    setPan({ x: 60, y: 40 })
  }, [])

  // Pan handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pan])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    },
    [isPanning, panStart]
  )

  const handlePointerUp = useCallback(() => setIsPanning(false), [])

  // Toggle category
  const toggleCategory = useCallback((cat: CategoryName) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // Determine node dimming
  const isNodeDimmed = useCallback(
    (id: string) => {
      if (focusMode && !LEARNING_PATH_IDS.has(id)) return true
      if (isSearchActive && !highlightedIds.has(id)) return true
      return false
    },
    [focusMode, isSearchActive, highlightedIds, LEARNING_PATH_IDS]
  )

  // Track container width for minimap
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Minimap calculations
  const minimapScale = 0.09
  const minimapW = CANVAS_W * minimapScale
  const minimapH = CANVAS_H * minimapScale
  const viewportW = Math.min(containerWidth, 1200) / zoom
  const viewportH = (isMobile ? 500 : 700) / zoom
  const minimapViewportX = (-pan.x / zoom) * minimapScale
  const minimapViewportY = (-pan.y / zoom) * minimapScale
  const minimapViewportW = viewportW * minimapScale
  const minimapViewportH = viewportH * minimapScale

  const nw = isMobile ? NODE_W_MOBILE : NODE_W
  const nh = isMobile ? NODE_H_MOBILE : NODE_H

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-gray-200/50 bg-white/60 backdrop-blur-xl',
        className
      )}
    >
      <CardContent className="p-0">
        {isLoadingTree ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200/30 border-t-gray-500" />
            <p className="mt-3 text-sm text-muted-foreground">Loading skill tree...</p>
          </div>
        ) : SKILLS.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Layers className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No skills available</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Skills will appear as you add them to your profile.</p>
          </div>
        ) : (
        <div>
        {/* ====== TOOLBAR ====== */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-3 bg-muted/20">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background/60 border-border/50"
            />
          </div>

          {/* Category filter buttons */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat]
              const isHidden = hiddenCategories.has(cat)
              return (
                <Button
                  key={cat}
                  variant={isHidden ? 'ghost' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-7 px-2 text-[11px] gap-1.5 transition-all',
                    !isHidden && `border-[${cfg.color}]/40 bg-[${cfg.color}]/10 text-[${cfg.color}]`,
                    isHidden && 'opacity-40'
                  )}
                  onClick={() => toggleCategory(cat)}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color, opacity: isHidden ? 0.3 : 1 }}
                  />
                  <span className="hidden sm:inline">{cat}</span>
                </Button>
              )
            })}
          </div>

          {/* Focus Mode */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">Focus</span>
            <Switch
              checked={focusMode}
              onCheckedChange={setFocusMode}
              className="scale-75"
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 border-l border-border/50 pl-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" onClick={zoomOut}>
                  <ZoomOut className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom Out</TooltipContent>
            </Tooltip>
            <span className="text-[10px] text-muted-foreground w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" onClick={zoomIn}>
                  <ZoomIn className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom In</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" onClick={resetView}>
                  <Maximize2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Reset View</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ====== TREE VIEWPORT ====== */}
        <div
          ref={containerRef}
          className={cn(
            'relative w-full overflow-hidden select-none',
            isMobile ? 'h-[500px]' : 'h-[700px]'
          )}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Transform container */}
          <div
            className="absolute origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              willChange: 'transform',
            }}
          >
            {/* Category cluster backgrounds */}
            {ALL_CATEGORIES.filter((c) => !hiddenCategories.has(c)).map((cat) => {
              const catSkills = visibleSkills.filter((s) => s.category === cat)
              if (catSkills.length === 0) return null
              const minX = Math.min(...catSkills.map((s) => s.x)) - 20
              const minY = Math.min(...catSkills.map((s) => s.y)) - 20
              const maxX = Math.max(...catSkills.map((s) => s.x)) + nw + 20
              const maxY = Math.max(...catSkills.map((s) => s.y)) + nh + 20
              const cfg = CATEGORY_CONFIG[cat]
              return (
                <motion.rect
                  key={cat}
                  x={minX}
                  y={minY}
                  width={maxX - minX}
                  height={maxY - minY}
                  rx={16}
                  fill={cfg.cluster}
                  stroke={cfg.color}
                  strokeWidth={1}
                  strokeOpacity={0.12}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
                />
              )
            })}

            {/* SVG layer for edges */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="edge-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(156,163,175,0.3)" />
                  <stop offset="100%" stopColor="rgba(209,213,219,0.3)" />
                </linearGradient>
              </defs>
              {visibleEdges.map((edge, i) => {
                const from = skillMap[edge.from]
                const to = skillMap[edge.to]
                if (!from || !to) return null
                const pathD = getBezierPath(from, to)
                const dimmed = isNodeDimmed(edge.from) || isNodeDimmed(edge.to)
                const highlighted =
                  isSearchActive &&
                  (highlightedIds.has(edge.from) || highlightedIds.has(edge.to))
                return (
                  <motion.path
                    key={`${edge.from}-${edge.to}`}
                    d={pathD}
                    fill="none"
                    stroke={highlighted ? 'rgba(107,114,128,0.7)' : 'url(#edge-grad)'}
                    strokeWidth={highlighted ? 2.5 : 1.5}
                    strokeLinecap="round"
                    custom={i}
                    variants={edgeVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ opacity: dimmed ? 0.08 : undefined }}
                  />
                )
              })}
            </svg>

            {/* Nodes layer */}
            {visibleSkills.map((skill, idx) => {
              const cfg = CATEGORY_CONFIG[skill.category]
              const dimmed = isNodeDimmed(skill.id)
              const highlighted = isSearchActive && highlightedIds.has(skill.id)
              const isLearningPath = LEARNING_PATH_IDS.has(skill.id)
              const isHovered = hoveredNode === skill.id

              return (
                <Tooltip key={skill.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      custom={idx}
                      variants={nodeVariants}
                      initial="hidden"
                      animate="visible"
                      className={cn(
                        'absolute group cursor-pointer',
                        dimmed && 'opacity-15'
                      )}
                      style={{
                        left: skill.x,
                        top: skill.y,
                        width: nw,
                        zIndex: isHovered ? 50 : dimmed ? 1 : 10,
                      }}
                      onPointerEnter={() => setHoveredNode(skill.id)}
                      onPointerLeave={() => setHoveredNode(null)}
                      whileHover={{
                        scale: 1.12,
                        transition: { duration: 0.2, ease: 'easeOut' as const },
                      }}
                    >
                      <div
                        className={cn(
                          'relative flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-200',
                          'bg-white/60 backdrop-blur-md border-gray-200/50',
                          highlighted
                            ? 'border-gray-400/60 shadow-lg shadow-gray-200/20'
                            : isHovered
                              ? 'border-gray-300/60 shadow-lg shadow-gray-200/30'
                              : 'border-gray-200/30 shadow-sm hover:border-gray-300/60',
                          focusMode && isLearningPath && !dimmed && 'ring-1 ring-gray-300/30',
                          isMobile && 'px-2 py-1.5 gap-1.5'
                        )}
                      >
                        {/* Proficiency ring */}
                        <svg
                          width={isMobile ? 24 : 30}
                          height={isMobile ? 24 : 30}
                          viewBox="0 0 36 36"
                          className="shrink-0"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            strokeWidth="2.5"
                            className={cn(
                              PROFICIENCY_RING[skill.proficiency],
                              dimmed ? 'opacity-20' : ''
                            )}
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="10"
                            fill={cfg.color}
                            fillOpacity={dimmed ? 0.1 : 0.15}
                          />
                          {skill.proficiency === 'completed' && (
                            <path
                              d="M12 18.5L16 22.5L24 14.5"
                              fill="none"
                              stroke={cfg.color}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity={dimmed ? 0.1 : 1}
                            />
                          )}
                          {skill.proficiency === 'in-progress' && (
                            <circle
                              cx="18"
                              cy="18"
                              r="4"
                              fill={cfg.color}
                              fillOpacity={dimmed ? 0.15 : 0.6}
                            />
                          )}
                          {skill.proficiency === 'not-started' && (
                            <circle
                              cx="18"
                              cy="18"
                              r="3"
                              fill="none"
                              stroke={cfg.color}
                              strokeWidth="1.5"
                              opacity={dimmed ? 0.1 : 0.4}
                            />
                          )}
                        </svg>

                        {/* Text content */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className={cn(
                              'font-semibold leading-tight truncate',
                              isMobile ? 'text-[10px]' : 'text-xs',
                              dimmed ? 'text-muted-foreground/40' : 'text-foreground'
                            )}
                          >
                            {skill.name}
                          </span>
                          {!isMobile && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'mt-0.5 h-4 w-fit text-[9px] px-1.5 leading-none font-medium',
                                cfg.bg,
                                cfg.text,
                                cfg.border
                              )}
                            >
                              {skill.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="max-w-[240px] bg-popover/95 backdrop-blur-md border-border/50"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />\n                        <span className="font-semibold text-sm">{skill.name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {skill.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1.5',
                            cfg.bg,
                            cfg.text,
                            cfg.border
                          )}
                        >
                          {skill.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1.5',
                            skill.proficiency === 'completed'
                              ? 'bg-gray-100 text-gray-700 border-gray-200'
                              : skill.proficiency === 'in-progress'
                                ? 'bg-gray-100 text-gray-600 border-gray-200'
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                          )}
                        >
                          {PROFICIENCY_LABEL[skill.proficiency]}
                        </Badge>
                        {isLearningPath && (
                          <Badge className="text-[9px] px-1.5 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200">
                            <GitBranch className="size-2.5 mr-0.5" />
                            On Path
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {/* ====== MINIMAP ====== */}
          <div className="absolute bottom-3 right-3 rounded-lg border border-border/50 bg-card/90 backdrop-blur-md p-1.5 shadow-lg z-20">
            <svg
              width={minimapW}
              height={minimapH}
              className="block"
              style={{ borderRadius: 6 }}
            >
              {/* Background */}
              <rect
                width={minimapW}
                height={minimapH}
                fill="rgba(0,0,0,0.2)"
                rx={4}
              />
              {/* Edges (simplified) */}
              {visibleEdges.map((edge) => {
                const from = skillMap[edge.from]
                const to = skillMap[edge.to]
                if (!from || !to) return null
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    x1={(from.x + nw / 2) * minimapScale}
                    y1={(from.y + nh / 2) * minimapScale}
                    x2={(to.x + nw / 2) * minimapScale}
                    y2={(to.y + nh / 2) * minimapScale}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={0.5}
                  />
                )
              })}
              {/* Nodes */}
              {visibleSkills.map((skill) => {
                const cfg = CATEGORY_CONFIG[skill.category]
                const dimmed = isNodeDimmed(skill.id)
                return (
                  <rect
                    key={skill.id}
                    x={skill.x * minimapScale}
                    y={skill.y * minimapScale}
                    width={nw * minimapScale}
                    height={nh * minimapScale}
                    rx={2}
                    fill={cfg.color}
                    fillOpacity={dimmed ? 0.1 : 0.55}
                  />
                )
              })}
              {/* Viewport rectangle */}
              <rect
                x={Math.max(0, minimapViewportX)}
                y={Math.max(0, minimapViewportY)}
                width={Math.min(minimapViewportW, minimapW)}
                height={Math.min(minimapViewportH, minimapH)}
                fill="none"
                stroke="rgba(107,114,128,0.5)"
                strokeWidth={1.5}
                rx={2}
              />
            </svg>
          </div>

          {/* ====== LEGEND ====== */}
          <div className="absolute bottom-3 left-3 rounded-lg border border-border/50 bg-card/90 backdrop-blur-md p-2.5 shadow-lg z-20">
            <div className="flex items-center gap-1 mb-2">
              <Layers className="size-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Legend
              </span>
            </div>
            <div className="space-y-1.5">
              {/* Categories */}
              <div className="space-y-1">
                {ALL_CATEGORIES.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat]
                  return (
                    <div key={cat} className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-[10px] text-muted-foreground">{cat}</span>
                    </div>
                  )
                })}
              </div>
              {/* Proficiency */}
              <div className="border-t border-border/30 pt-1.5 space-y-1">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </span>
                {(
                  [
                    ['Completed', 'fill-gray-700'],
                    ['In Progress', 'fill-gray-400'],
                    ['Not Started', 'fill-gray-200'],
                  ] as const
                ).map(([label, fillClass]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        strokeWidth="2.5"
                        className={fillClass}
                      />
                    </svg>
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ====== STATUS BAR ====== */}
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 bg-muted/15 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <GitBranch className="size-3" />
              {visibleSkills.length} skills
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {visibleEdges.length} connections
            </span>
            {focusMode && (
              <Badge
                variant="outline"
                className="h-5 text-[9px] px-1.5 bg-gray-100 text-gray-700 border-gray-200"
              >
                <EyeOff className="size-2.5 mr-0.5" />
                Focus Mode
              </Badge>
            )}
          </div>
          <span className="hidden sm:inline">Drag to pan · Scroll to zoom</span>
        </div>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
