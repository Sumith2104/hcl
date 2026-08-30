'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  CheckCircle2, Lock, PlayCircle, Clock, BookOpen, ExternalLink,
  ChevronDown, ChevronUp, Star, Loader2, Map, MessageSquare, Target,
  Sparkles, RefreshCw, Tag, Download, Share2, GraduationCap, Play,
  FileText, Code, FileCode, Clock3,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { RoadmapPDFExport } from './RoadmapPDFExport'

function sanitizeUrl(url: string): string {
  if (!url) return '#'
  url = url.trim()
  // Fix common AI-generated URL mistakes: "https/example.com" → "https://example.com"
  // Also handles "http:/x", "https:x", "https:///x" etc.
  url = url.replace(/^(https?)[\/:]*/, '$1://')
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return 'https:' + url
  if (url.startsWith('www.')) return 'https://' + url
  if (url.includes('.') && !url.includes(' ')) return 'https://' + url
  return '#'
}

export function RoadmapView() {
  const { user, setView, profile, setRoadmapLoading } = useAppStore()
  const [roadmap, setRoadmap] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [progressDialog, setProgressDialog] = useState<{ open: boolean; item: any }>({ open: false, item: null })
  const [completionPct, setCompletionPct] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadRoadmap()
  }, [])

  const loadRoadmap = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/roadmap?userId=${user!.id}`)
      const data = await res.json()
      if (data.roadmap) {
        setRoadmap(data.roadmap)
        const items = data.roadmap.items || []
        const firstActive = items.find((i: any) => i.status === 'in_progress' || i.status === 'available')
        if (firstActive) setExpandedPhase(firstActive.phase)
        else if (items.length > 0) setExpandedPhase(items[0].phase)
      }
    } catch { toast.error('Failed to load roadmap') }
    finally { setLoading(false) }
  }

  const handleGenerateFromProfile = async () => {
    setRoadmapLoading(true)
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, profile }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success('Roadmap generated!')
      loadRoadmap()
    } catch { toast.error('Failed to generate roadmap') }
    finally { setRoadmapLoading(false) }
  }

  const handleExportRoadmap = () => {
    if (!roadmap) return
    const items = roadmap.items || []
    const phasesMap: Record<number, any[]> = {}
    for (const item of items) {
      if (!phasesMap[item.phase]) phasesMap[item.phase] = []
      phasesMap[item.phase].push(item)
    }
    const sortedP = Object.keys(phasesMap).map(Number).sort((a, b) => a - b)

    let text = `Study Buddies Learning Roadmap\n${'='.repeat(40)}\n`
    text += `Goal: ${roadmap.targetGoal}\n`
    text += `Estimated Duration: ${roadmap.estimatedDurationWeeks} weeks\n`
    text += `Overall Progress: ${overallPct}%\n\n`

    for (const pNum of sortedP) {
      const pItems = phasesMap[pNum]
      const completed = pItems.filter(i => i.status === 'completed').length
      text += `\n--- Phase ${pNum}: ${pItems[0]?.title || 'Learning Phase'} (${completed}/${pItems.length} completed) ---\n\n`
      for (const item of pItems) {
        const statusIcon = item.status === 'completed' ? '✅' : item.status === 'in_progress' ? '🔄' : item.status === 'available' ? '⭐' : '🔒'
        text += `  ${statusIcon} ${item.title}`
        if (item.estimatedHours) text += ` (~${item.estimatedHours}h)`
        if (item.milestone) text += ` [🎯 ${item.milestone}]`
        text += '\n'
        if (item.description) text += `      ${item.description}\n`
        if (item.resources?.length > 0) {
          text += `      Resources:\n`
          for (const r of item.resources) {
            text += `        - ${r.resource?.title || 'Resource'} (${r.resource?.type})\n`
          }
        }
        text += '\n'
      }
    }

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `study-buddies-roadmap-${roadmap.targetGoal?.toLowerCase().replace(/\s+/g, '-') || 'learning'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Roadmap exported!')
  }

  const handleShareRoadmap = () => {
    if (!roadmap) return
    const text = `I'm learning to become a ${roadmap.targetGoal} with Study Buddies! I'm ${overallPct}% through my personalized roadmap. #Study Buddies #LearningJourney`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast.success('Share text copied to clipboard!')
    } else {
      toast.info('Share: ' + text)
    }
  }

  const handleSubmitProgress = async () => {
    if (!progressDialog.item) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          roadmapItemId: progressDialog.item.id,
          completionPercentage: completionPct,
          feedback,
        }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success('Progress updated!')
      if (data.adaptationMessage) {
        toast.info(data.adaptationMessage, { duration: 6000 })
      }
      setProgressDialog({ open: false, item: null })
      setCompletionPct(0)
      setFeedback('')
      loadRoadmap()
    } catch { toast.error('Failed to update progress') }
    finally { setSubmitting(false) }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-neutral-900" />
      case 'in_progress': return <PlayCircle className="h-5 w-5 text-gray-500" />
      case 'available': return <Target className="h-5 w-5 text-gray-400" />
      default: return <Lock className="h-5 w-5 text-muted-foreground/40" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-gray-200 text-gray-800',
      in_progress: 'bg-gray-100 text-gray-700',
      available: 'bg-gray-50 text-gray-600',
      locked: 'bg-gray-100 text-gray-500',
    }
    const labels: Record<string, string> = {
      completed: 'Completed', in_progress: 'In Progress', available: 'Available', locked: 'Locked',
    }
    return <Badge className={`text-xs ${variants[status] || variants.locked}`}>{labels[status] || status}</Badge>
  }

  const getItemProgress = (itemId: string) => {
    const item = roadmap?.items?.find((i: any) => i.id === itemId)
    return item?.progress?.[0]?.completionPercentage || 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            {/* SVG Roadmap Illustration */}
            <svg viewBox="0 0 300 140" className="w-64 h-auto mb-6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 110 Q60 110 80 85 Q100 60 130 75 Q160 90 180 60 Q200 30 230 50 Q250 65 270 45" stroke="#374151" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 8" opacity="0.6" />
              <circle cx="40" cy="110" r="8" fill="#f9fafb" stroke="#9ca3af" strokeWidth="2" />
              <circle cx="100" cy="62" r="8" fill="#f9fafb" stroke="#9ca3af" strokeWidth="2" />
              <circle cx="160" cy="82" r="8" fill="#f9fafb" stroke="#9ca3af" strokeWidth="2" />
              <circle cx="220" cy="42" r="8" fill="#f9fafb" stroke="#9ca3af" strokeWidth="2" />
              <circle cx="270" cy="45" r="10" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 3" />
              <path d="M266 45 L270 41 L274 45 L270 49 Z" fill="#9ca3af" opacity="0.5" />
              <path d="M270 33 L270 20" stroke="#9ca3af" strokeWidth="1.5" />
              <path d="M270 20 L282 25 L270 30" fill="#374151" opacity="0.6" />
            </svg>

            <h2 className="text-xl font-semibold mb-1">No Roadmap Yet</h2>
            {profile?.targetGoal && (
              <p className="text-sm text-gray-600 mb-1">
                Your target: <span className="font-medium text-foreground">{profile.targetGoal}</span>
              </p>
            )}
            <p className="text-sm text-gray-600 mb-6 text-center max-w-sm">
              {profile?.targetGoal
                ? "You're almost there! Complete onboarding or generate a roadmap from your current profile."
                : 'Complete onboarding first to generate your personalized learning path.'}
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Button onClick={() => setView('onboarding')} className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800">
                <Sparkles className="h-4 w-4" />
                Start Onboarding
              </Button>
              {profile?.targetGoal && (
                <Button variant="outline" onClick={handleGenerateFromProfile} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Generate from Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group items by phase
  const phases: Record<number, any[]> = {}
  for (const item of roadmap.items || []) {
    if (!phases[item.phase]) phases[item.phase] = []
    phases[item.phase].push(item)
  }

  const sortedPhases = Object.keys(phases).map(Number).sort((a, b) => a - b)
  const completedCount = (roadmap.items || []).filter((i: any) => i.status === 'completed').length
  const totalCount = (roadmap.items || []).length
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const getPhaseDuration = (phaseItems: any[]) => {
    const totalHours = phaseItems.reduce((s: number, i: any) => s + (i.estimatedHours || 0), 0)
    if (totalHours <= 0) return ''
    const weeks = Math.ceil(totalHours / 10)
    return ` · ~${totalHours}h · ~${weeks} week${weeks > 1 ? 's' : ''}`
  }

  const resourceTypeConfig: Record<string, { icon: React.ReactNode; badgeClass: string; label: string }> = {
    course: { icon: <GraduationCap className="h-4 w-4" />, badgeClass: 'bg-gray-200 text-gray-700', label: 'Course' },
    video: { icon: <Play className="h-4 w-4" />, badgeClass: 'bg-gray-100 text-gray-600', label: 'Video' },
    article: { icon: <FileText className="h-4 w-4" />, badgeClass: 'bg-gray-100 text-gray-600', label: 'Article' },
    tutorial: { icon: <Code className="h-4 w-4" />, badgeClass: 'bg-gray-100 text-gray-600', label: 'Tutorial' },
    documentation: { icon: <FileCode className="h-4 w-4" />, badgeClass: 'bg-gray-100 text-gray-600', label: 'Docs' },
    book: { icon: <BookOpen className="h-4 w-4" />, badgeClass: 'bg-gray-100 text-gray-600', label: 'Book' },
    project: { icon: <Sparkles className="h-4 w-4" />, badgeClass: 'bg-gray-100 text-gray-600', label: 'Project' },
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Learning Roadmap</h1>
            <p className="text-gray-500">Goal: {roadmap.targetGoal} &middot; {roadmap.estimatedDurationWeeks} weeks</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">{overallPct}%</p>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportRoadmap}>
                <Download className="h-4 w-4" /> Export
              </Button>
              <RoadmapPDFExport />
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShareRoadmap}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setView('assistant')}>
                <MessageSquare className="h-4 w-4" /> Ask AI
              </Button>
            </div>
          </div>
        </div>
        <Progress value={overallPct} className="h-2.5" />
      </div>

      {/* Phases */}
      <div className="space-y-6">
        {sortedPhases.map((phaseNum, phaseIdx) => {
          const items = phases[phaseNum]
          const phaseCompleted = items.filter(i => i.status === 'completed').length
          const phaseTotal = items.length
          const isExpanded = expandedPhase === phaseNum
          const allCompleted = phaseCompleted === phaseTotal
          const prevPhaseCompleted = phaseIdx > 0 ? (phases[sortedPhases[phaseIdx - 1]] || []).every((i: any) => i.status === 'completed') : false

          return (
            <motion.div
              key={phaseNum}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIdx * 0.1 }}
            >
              {phaseIdx > 0 && (
                <div className="flex items-center justify-center my-1">
                  <div className="relative flex items-center justify-center w-8 h-8">
                    <div className="absolute w-0.5 h-full phase-connector rounded-full" />
                    <div className={`h-3 w-3 rounded-full border-2 border-background shadow-sm z-10 ${
                      prevPhaseCompleted
                        ? 'bg-neutral-100 shadow-sm/30'
                        : 'bg-muted-foreground/30'
                    }`} />
                  </div>
                </div>
              )}

              <Card className={`overflow-hidden transition-all duration-300 bg-white/60 backdrop-blur-md border border-white/40 ${allCompleted ? 'shadow-sm' : isExpanded ? 'shadow-lg' : ''}`}>
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedPhase(isExpanded ? null : phaseNum)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${
                          allCompleted
                            ? 'bg-neutral-900 text-white'
                            : isExpanded
                            ? 'phase-badge-gradient text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {allCompleted ? <CheckCircle2 className="h-5 w-5" /> : phaseNum}
                        </div>
                        <div>
                          <CardTitle className="text-base">{items[0]?.title || `Phase ${phaseNum}`}</CardTitle>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {phaseCompleted}/{phaseTotal} items{getPhaseDuration(items)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(phaseCompleted === phaseTotal ? 'completed' : phaseIdx === 0 || phases[phaseNum - 1]?.every((i: any) => i.status === 'completed') ? 'available' : 'locked')}
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-3 ml-5 pl-5 border-l-2 border-neutral-200/60 dark:border-neutral-200/60 relative">
                          <div className="absolute left-[-2px] top-0 bottom-0 w-0.5 phase-connector rounded-full opacity-30" />

                          {items.map((item) => {
                            const isItemExpanded = expandedItem === item.id
                            const itemProgress = getItemProgress(item.id)
                            return (
                              <div key={item.id} className="relative">
                                <div className={`absolute -left-[1.35rem] top-4 h-3 w-3 rounded-full border-2 border-background shadow-sm ${
                                  item.status === 'completed' ? 'bg-gray-400 shadow-gray-400/30' :
                                  item.status === 'in_progress' ? 'bg-gray-500 shadow-gray-500/30' :
                                  item.status === 'available' ? 'bg-gray-300 shadow-gray-300/30' : 'bg-muted-foreground/30'
                                }`} />

                                <div className={`rounded-xl border p-4 transition-all duration-200 bg-white/60 backdrop-blur-sm ${
                                  item.status === 'completed' && item.milestone
                                    ? 'border-gray-300 shadow-sm'
                                    : item.status === 'in_progress'
                                    ? 'border-gray-300 shadow-sm'
                                    : 'border-white/40 hover:border-white/60 hover:shadow-sm'
                                }`}>
                                  <button className="w-full text-left" onClick={() => setExpandedItem(isItemExpanded ? null : item.id)}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-3 flex-1">
                                        {getStatusIcon(item.status)}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium">{item.title}</span>
                                            {getStatusBadge(item.status)}
                                          </div>
                                          {item.milestone && (
                                            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                                              item.status === 'completed'
                                                ? 'bg-gray-200 text-gray-700 border border-gray-300'
                                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}>
                                              {item.status === 'completed'
                                                ? <CheckCircle2 className="h-3.5 w-3.5" />
                                                : <Target className="h-3.5 w-3.5" />}
                                              {item.milestone}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {isItemExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                                    </div>
                                  </button>

                                  {itemProgress > 0 && (
                                    <div className="mt-2 ml-8">
                                      <Progress value={itemProgress} className="h-1.5" />
                                    </div>
                                  )}

                                  <AnimatePresence initial={false}>
                                    {isItemExpanded && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-4 ml-8 space-y-4">
                                          {item.skill?.category && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                              <Tag className="h-3 w-3" />
                                              <span>Category: {item.skill.category}</span>
                                            </div>
                                          )}

                                          {item.description && (
                                            <p className="text-sm text-gray-600">{item.description}</p>
                                          )}

                                          <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3 flex items-center gap-1.5">
                                              <BookOpen className="h-3.5 w-3.5" /> Resources
                                            </h4>
                                            {item.resources && item.resources.length > 0 ? (
                                              <div className="grid gap-2.5">
                                                {item.resources.map((r: any, ri: number) => {
                                                  const resType = r.resource?.type || 'article'
                                                  const config = resourceTypeConfig[resType] || resourceTypeConfig.article
                                                  return (
                                                    <a
                                                      key={ri}
                                                      href={sanitizeUrl(r.resource?.url || '')}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="group flex items-start gap-3 rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-3.5 hover:bg-white/80 hover:border-white/60 hover:shadow-sm transition-all duration-200"
                                                    >
                                                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm border border-white/40 transition-transform group-hover:scale-110`}>
                                                        {config.icon}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${config.badgeClass}`}>
                                                            {config.label}
                                                          </span>
                                                          {r.resource?.estimatedHours != null && r.resource.estimatedHours > 0 && (
                                                            <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                                              <Clock3 className="h-2.5 w-2.5" />
                                                              {r.resource.estimatedHours}h
                                                            </span>
                                                          )}
                                                        </div>
                                                        <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                          {r.resource?.title || 'Untitled Resource'}
                                                        </p>
                                                        {r.resource?.description && (
                                                          <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                            {r.resource.description}
                                                          </p>
                                                        )}
                                                      </div>
                                                      <ExternalLink className="mt-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </a>
                                                  )
                                                })}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-gray-500 italic py-2">No resources assigned yet</p>
                                            )}
                                          </div>

                                          {item.status !== 'completed' && item.status !== 'locked' && (
                                            <Dialog open={progressDialog.open && progressDialog.item?.id === item.id} onOpenChange={(open) => setProgressDialog({ open, item: open ? item : null })}>
                                              <DialogTrigger asChild>
                                                <Button size="sm" className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800">
                                                  {item.status === 'in_progress' ? 'Update Progress' : 'Start Learning'}
                                                  <PlayCircle className="h-3.5 w-3.5" />
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent>
                                                <DialogHeader>
                                                  <DialogTitle>Update Progress: {item.title}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 mt-2">
                                                  <div className="space-y-2">
                                                    <Label>Completion</Label>
                                                    <div className="flex items-center gap-4">
                                                      <Slider
                                                        value={[completionPct]}
                                                        onValueChange={(v) => setCompletionPct(v[0])}
                                                        min={0}
                                                        max={100}
                                                        step={5}
                                                        className="flex-1"
                                                      />
                                                      <span className="text-sm font-bold text-gray-800 w-12 text-right">{completionPct}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                      <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                                                    </div>
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label>How is it going? (optional)</Label>
                                                    <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="e.g., This is challenging, I need more practice..." rows={3} />
                                                  </div>
                                                  <Button onClick={handleSubmitProgress} disabled={submitting} className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
                                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                    Save Progress
                                                  </Button>
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
