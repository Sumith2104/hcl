'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore, ACHIEVEMENTS, type AchievementRarity } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
 User, Target, Clock, BookOpen, Plus, X, Loader2, Save, Sparkles, Activity,
 Flame, Trophy, CheckCircle2, Zap, Pencil, Check, BookCheck, Star, Calendar, ArrowRight,
 Footprints, Compass, MessageCircle, GraduationCap, Crown, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'

const proficiencyMap: Record<string, number> = {
 beginner: 25,
 intermediate: 50,
 advanced: 75,
 expert: 100,
}

const levelColorMap: Record<string, { dot: string; bar: string; bg: string; text: string }> = {
 beginner: {
 dot: 'bg-gray-300',
 bar: 'bg-gray-300',
 bg: 'bg-white/60 backdrop-blur-sm border border-white/40',
 text: 'text-gray-600',
 },
 intermediate: {
 dot: 'bg-gray-400',
 bar: 'bg-gray-400',
 bg: 'bg-white/60 backdrop-blur-sm border border-white/40',
 text: 'text-gray-600',
 },
 advanced: {
 dot: 'bg-gray-500',
 bar: 'bg-gray-500',
 bg: 'bg-white/60 backdrop-blur-sm border border-white/40',
 text: 'text-gray-700',
 },
 expert: {
 dot: 'bg-neutral-700',
 bar: 'bg-neutral-700',
 bg: 'bg-white/60 backdrop-blur-sm border border-white/40',
 text: 'text-gray-800',
 },
}

const rarityColorMap: Record<AchievementRarity, { bg: string; text: string; border: string; glow: string }> = {
 common: { bg: 'bg-white/60 backdrop-blur-sm border border-white/40', text: 'text-gray-600', border: 'border-gray-200', glow: 'rarity-common' },
 great: { bg: 'bg-white/60 backdrop-blur-sm border border-white/40', text: 'text-gray-600', border: 'border-gray-200', glow: 'rarity-great' },
 rare: { bg: 'bg-white/60 backdrop-blur-sm border border-white/40', text: 'text-gray-700', border: 'border-gray-200', glow: 'rarity-rare' },
 legendary: { bg: 'bg-white/60 backdrop-blur-sm border border-white/40', text: 'text-gray-700', border: 'border-gray-300', glow: 'rarity-legendary' },
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
 const [count, setCount] = useState(0)
 const mounted = useRef(false)

 useEffect(() => {
 if (!mounted.current) {
 mounted.current = true
 let start = 0
 const startTime = performance.now()
 const step = (now: number) => {
 const elapsed = now - startTime
 const progress = Math.min(elapsed / duration, 1)
 const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
 setCount(Math.round(eased * target))
 if (progress < 1) requestAnimationFrame(step)
 }
 requestAnimationFrame(step)
 }
 }, [target, duration])

 return count
}

// Lucide icon map for achievements
const iconMap: Record<string, React.ElementType> = {
 Footprints, Compass, BookOpen, Flame, MessageCircle, Star, Trophy, GraduationCap, Zap, Sparkles, Crown, Shield,
 CheckCircle2, Target, Clock, BookCheck,
}



function formatRelativeDate(date: Date): string {
 const now = new Date()
 const diffMs = now.getTime() - date.getTime()
 const diffMinutes = Math.floor(diffMs / 60000)
 const diffHours = Math.floor(diffMinutes / 60)
 const diffDays = Math.floor(diffHours / 24)
 if (diffMinutes < 1) return 'just now'
 if (diffMinutes < 60) return `${diffMinutes}m ago`
 if (diffHours < 24) return `${diffHours}h ago`
 if (diffDays === 1) return '1 day ago'
 return `${diffDays} days ago`
}

function parseTimelineDate(dateStr: string): number {
 const now = new Date()
 const n = parseInt(dateStr)
 if (dateStr.includes('minute') || dateStr.includes('just')) return now.getTime() - (n || 0) * 60000
 if (dateStr.includes('hour')) return now.getTime() - n * 3600000
 if (dateStr.includes('day')) return now.getTime() - n * 86400000
 return now.getTime()
}

type TimelineItem = {
 id: string
 icon: React.ElementType
 title: string
 desc: string
 date: string
 color: string
}

export function ProfileView() {
 const { user, profile, setProfile, setView, dashboardStats, earnedAchievements, streakData } = useAppStore()
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [userSkills, setUserSkills] = useState<any[]>([])
 const [newSkill, setNewSkill] = useState('')
 const [newLevel, setNewLevel] = useState('intermediate')
 const [editMode, setEditMode] = useState(false)
 const [editName, setEditName] = useState('')
 const [dailyGoal, setDailyGoal] = useState(2)
 const [notifPrefs, setNotifPrefs] = useState({ reminders: true, achievements: true, tips: false })
 const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
 const [isLoadingTimeline, setIsLoadingTimeline] = useState(true)
 const [profileForm, setProfileForm] = useState({
 targetGoal: '',
 experienceLevel: 'beginner',
 availableHoursPerWeek: 10,
 preferredLearningStyle: 'mixed',
 targetDurationWeeks: 16,
 })

 const animSkills = useAnimatedCounter(0, 600)
 const animStreak = useAnimatedCounter(streakData?.streak ?? 0, 800)
 const animCompleted = useAnimatedCounter(dashboardStats.completedItems, 700)
 const animHours = useAnimatedCounter(Math.round((profileForm.availableHoursPerWeek * (dashboardStats.overallProgress / 100)) * 4), 900)

 useEffect(() => { loadProfile() }, [])

 // Fetch timeline data
 useEffect(() => {
 if (!user) return
 setIsLoadingTimeline(true)
 Promise.all([
 fetch(`/api/study-sessions?userId=${user.id}`).then(r => r.json()).catch(() => ({ sessions: [] })),
 fetch(`/api/achievements?userId=${user.id}`).then(r => r.json()).catch(() => ({ earnedAchievements: [] })),
 ]).then(([sessionData, achievementData]) => {
 const items: TimelineItem[] = []
 let idx = 0

 // Map study sessions (last 5)
 const sessions = (sessionData.sessions || []).slice(0, 5)
 for (const s of sessions) {
 const d = new Date(s.createdAt)
 items.push({
 id: `session-${idx++}`,
 icon: BookCheck,
 title: `Study Session: ${s.skillName || 'Untitled'}`,
 desc: `${s.duration || 0} min - ${s.notes || 'No notes'}`,
 date: formatRelativeDate(d),
 color: 'text-gray-700 bg-white/60 backdrop-blur-sm border border-white/40',
 })
 }

 // Map achievements (last 5)
 const achievements = (achievementData.earnedAchievements || []).slice(0, 5)
 for (const a of achievements) {
 const def = ACHIEVEMENTS.find(ach => ach.id === a.achievementId)
 const d = new Date(a.earnedAt)
 items.push({
 id: `achievement-${idx++}`,
 icon: Trophy,
 title: `Achievement Unlocked: ${def?.name || 'Unknown'}`,
 desc: def?.description || '',
 date: formatRelativeDate(d),
 color: 'text-gray-600 bg-white/60 backdrop-blur-sm border border-white/40',
 })
 }

 // Sort by date (most recent first)
 items.sort((a, b) => {
 const dateA = parseTimelineDate(a.date)
 const dateB = parseTimelineDate(b.date)
 return dateB - dateA
 })

 setTimelineItems(items.slice(0, 10))
 }).finally(() => setIsLoadingTimeline(false))
 }, [user])

 const loadProfile = async () => {
 setLoading(true)
 try {
 const res = await fetch(`/api/profile?userId=${user!.id}`)
 const data = await res.json()
 if (data.profile) {
 const p = data.profile
 setProfile(p)
 setProfileForm({
 targetGoal: p.targetGoal || '',
 experienceLevel: p.experienceLevel || 'beginner',
 availableHoursPerWeek: p.availableHoursPerWeek || 10,
 preferredLearningStyle: p.preferredLearningStyle || 'mixed',
 targetDurationWeeks: p.targetDurationWeeks || 16,
 })
 }
 if (data.userSkills) setUserSkills(data.userSkills)
 } catch { toast.error('Failed to load profile') }
 finally { setLoading(false) }
 }

 const handleSaveProfile = async () => {
 setSaving(true)
 try {
 const res = await fetch('/api/profile', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: user!.id, ...profileForm }),
 })
 const data = await res.json()
 if (data.error) { toast.error(data.error); return }
 setProfile(data.profile)
 toast.success('Profile updated!')
 } catch { toast.error('Failed to save') }
 finally { setSaving(false) }
 }

 const handleAddSkill = async () => {
 if (!newSkill.trim()) return
 setSaving(true)
 try {
 const res = await fetch('/api/profile', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: user!.id, addSkill: { name: newSkill.trim(), level: newLevel } }),
 })
 const data = await res.json()
 if (data.error) { toast.error(data.error); return }
 setUserSkills(data.userSkills || userSkills)
 setNewSkill('')
 toast.success('Skill added!')
 } catch { toast.error('Failed to add skill') }
 finally { setSaving(false) }
 }

 const handleRemoveSkill = async (skillName: string) => {
 try {
 await fetch('/api/profile', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: user!.id, removeSkill: skillName }),
 })
 setUserSkills(prev => prev.filter(s => s.skill.name !== skillName))
 toast.success('Skill removed')
 } catch { toast.error('Failed to remove skill') }
 }

 const handleSaveName = () => {
 setEditMode(false)
 toast.success('Name updated!')
 }

 // Get top 3 earned achievements with full definitions
 const topAchievements = earnedAchievements.slice(0, 3).map(ea => {
 const def = ACHIEVEMENTS.find(a => a.id === ea.achievementId)
 return def ? { ...def, earnedAt: ea.earnedAt } : null
 }).filter(Boolean) as (typeof ACHIEVEMENTS[number] & { earnedAt: Date })[]

 if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-neutral-900" /></div>

 const statsCards = [
 { label: 'Skills', value: userSkills.length || animSkills, icon: BookOpen, iconColor: 'text-gray-700' },
 { label: 'Streak', value: streakData?.streak ?? animStreak, suffix: 'd', icon: Flame, iconColor: 'text-gray-600' },
 { label: 'Completed', value: dashboardStats.completedItems || animCompleted, icon: CheckCircle2, iconColor: 'text-gray-600' },
 { label: 'Hours', value: animHours, icon: Clock, iconColor: 'text-gray-600' },
 ]

 return (
 <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 pb-16">
 {/* Profile Header with Cover Banner */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, ease: 'easeOut' as const }}
 className="relative rounded-2xl overflow-hidden mb-8"
 >
 {/* Cover Banner */}
 <div className="profile-cover-gradient h-32 sm:h-40 relative">
 <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
 <div className="absolute inset-0" style={{
 backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)',
 }} />
 </div>

 {/* Avatar + Info overlapping the banner */}
 <div className="relative px-4 sm:px-6 pb-4">
 <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
 <div className="relative">
 <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl ring-4 ring-background shadow-elevated">
 {user?.name?.charAt(0).toUpperCase()}
 </div>
 <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-neutral-900 ring-2 ring-background flex items-center justify-center">
 <Sparkles className="h-3.5 w-3.5 text-white" />
 </div>
 </div>
 <div className="flex-1 min-w-0 sm:pb-1">
 <div className="flex items-center gap-2">
 {editMode ? (
 <div className="flex items-center gap-2">
 <Input
 value={editName}
 onChange={(e) => setEditName(e.target.value)}
 className="h-8 w-48 text-base font-semibold"
 autoFocus
 onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
 />
 <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}>
 <Check className="h-4 w-4 text-neutral-900" />
 </Button>
 <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditMode(false)}>
 <X className="h-4 w-4" />
 </Button>
 </div>
 ) : (
 <>
 <h1 className="text-xl sm:text-2xl font-bold truncate">{user?.name}</h1>
 <Button
 size="icon"
 variant="ghost"
 className="h-7 w-7 shrink-0"
 onClick={() => { setEditName(user?.name || ''); setEditMode(true) }}
 aria-label="Edit name"
 >
 <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
 </Button>
 </>
 )}
 <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white">PRO</span>
 </div>
 <p className="text-sm text-muted-foreground mt-0.5 truncate">{user?.email}</p>
 {profile?.targetGoal && (
 <p className="text-sm text-gray-700 mt-1 flex items-center gap-1.5">
 <Target className="h-3.5 w-3.5" />
 {profile.targetGoal}
 </p>
 )}
 </div>
 <div className="sm:pb-1 flex gap-2">
 <Button variant="outline" size="sm" className="gap-2" onClick={() => setView('roadmap')}>
 <Sparkles className="h-4 w-4 text-neutral-900" /> Regenerate Roadmap
 </Button>
 </div>
 </div>
 </div>
 </motion.div>

 {/* Stats Cards Row */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' as const }}
 className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
 >
 {statsCards.map((stat, i) => {
 const Icon = stat.icon
 return (
 <motion.div
 key={stat.label}
 initial={{ opacity: 0, y: 16, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: 'easeOut' as const }}
 >
 <Card className="relative overflow-hidden bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
 <CardContent className="p-4 sm:p-5">
 <div className="flex items-center justify-between mb-3">
 <div className={`h-9 w-9 rounded-xl bg-background/80 flex items-center justify-center shadow-soft`}>
 <Icon className={`h-4.5 w-4.5 ${stat.iconColor}`} />
 </div>
 <span className="text-2xl sm:text-3xl font-bold tabular-nums">
 {stat.value}{stat.suffix || ''}
 </span>
 </div>
 <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
 </CardContent>
 </Card>
 </motion.div>
 )
 })}
 </motion.div>

 <div className="grid gap-6 lg:grid-cols-5">
 {/* Profile Card */}
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, ease: 'easeOut' as const }} className="lg:col-span-3">
 <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <User className="h-4 w-4" /> Learning Profile
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>Target Goal</Label>
 <Input value={profileForm.targetGoal} onChange={(e) => setProfileForm(p => ({ ...p, targetGoal: e.target.value }))} placeholder="e.g., Machine Learning Engineer" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Experience Level</Label>
 <Select value={profileForm.experienceLevel} onValueChange={(v) => setProfileForm(p => ({ ...p, experienceLevel: v }))}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="beginner">Beginner</SelectItem>
 <SelectItem value="intermediate">Intermediate</SelectItem>
 <SelectItem value="advanced">Advanced</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>Hours/Week</Label>
 <Input type="number" min={1} max={80} value={profileForm.availableHoursPerWeek} onChange={(e) => setProfileForm(p => ({ ...p, availableHoursPerWeek: Number(e.target.value) }))} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Learning Style</Label>
 <Select value={profileForm.preferredLearningStyle} onValueChange={(v) => setProfileForm(p => ({ ...p, preferredLearningStyle: v }))}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="visual">Visual</SelectItem>
 <SelectItem value="reading">Reading</SelectItem>
 <SelectItem value="video">Video</SelectItem>
 <SelectItem value="hands-on">Hands-on</SelectItem>
 <SelectItem value="mixed">Mixed</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>Target Weeks</Label>
 <Input type="number" min={4} max={52} value={profileForm.targetDurationWeeks} onChange={(e) => setProfileForm(p => ({ ...p, targetDurationWeeks: Number(e.target.value) }))} />
 </div>
 </div>
 <Button onClick={handleSaveProfile} disabled={saving} className="w-full bg-neutral-900 text-white hover:bg-neutral-800 gap-2">
 {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
 Save Profile
 </Button>
 </CardContent>
 </Card>
 </motion.div>

 {/* Preferences Card */}
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: 'easeOut' as const }} className="lg:col-span-2 space-y-4">
 <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
 <CardHeader className="pb-4">
 <CardTitle className="text-base flex items-center gap-2">
 <Zap className="h-4 w-4" /> Preferences
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-5">
 {/* Daily Learning Goal */}
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-medium">Daily Goal</p>
 <p className="text-xs text-muted-foreground mt-0.5">Hours per day target</p>
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="icon"
 className="h-8 w-8"
 onClick={() => setDailyGoal(Math.max(1, dailyGoal - 0.5))}
 >
 <span className="text-sm font-bold">−</span>
 </Button>
 <span className="w-10 text-center text-sm font-semibold tabular-nums">{dailyGoal}h</span>
 <Button
 variant="outline"
 size="icon"
 className="h-8 w-8"
 onClick={() => setDailyGoal(Math.min(12, dailyGoal + 0.5))}
 >
 <span className="text-sm font-bold">+</span>
 </Button>
 </div>
 </div>

 {/* Notification Preferences */}
 <div className="space-y-3">
 <p className="text-sm font-medium">Notifications</p>
 {([
 { key: 'reminders' as const, label: 'Study reminders', desc: 'Daily learning nudges' },
 { key: 'achievements' as const, label: 'Achievement alerts', desc: 'Milestone celebrations' },
 { key: 'tips' as const, label: 'Learning tips', desc: 'Curated suggestions' },
 ]).map((item) => (
 <div key={item.key} className="flex items-center justify-between">
 <div>
 <p className="text-sm">{item.label}</p>
 <p className="text-xs text-muted-foreground">{item.desc}</p>
 </div>
 <Switch
 checked={notifPrefs[item.key]}
 onCheckedChange={(checked) => setNotifPrefs(p => ({ ...p, [item.key]: checked }))}
 />
 </div>
 ))}
 </div>

 {/* Progress overview */}
 <div className="pt-3 border-t border-border/50">
 <div className="flex items-center justify-between text-sm mb-2">
 <span className="text-muted-foreground">Overall Progress</span>
 <span className="font-semibold text-gray-800 tabular-nums">{dashboardStats.overallProgress}%</span>
 </div>
 <Progress value={dashboardStats.overallProgress} className="h-2" />
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </div>

 {/* Skills with color coding and animated bars */}
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, ease: 'easeOut' as const }} className="mt-6">
 <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <BookOpen className="h-4 w-4" /> Your Skills ({userSkills.length})
 </CardTitle>
 </CardHeader>
 <CardContent>
 {userSkills.length > 0 ? (
 <div className="grid gap-3 sm:grid-cols-2">
 {userSkills.map((us: any, idx: number) => {
 const level = us.proficiencyLevel || 'beginner'
 const colors = levelColorMap[level] || levelColorMap.beginner
 const proficiency = proficiencyMap[level] || 25
 const category = us.skill?.category || ''
 const skillName = us.skill?.name || us.skillName || 'Unknown'

 return (
 <motion.div
 key={us.id}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 + idx * 0.04, duration: 0.3, ease: 'easeOut' as const }}
 className={`relative flex items-start gap-3 rounded-xl border border-border/50 p-3 ${colors.bg} transition-all hover:shadow-sm`}
 >
 <button
 onClick={() => handleRemoveSkill(skillName)}
 className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
 aria-label={`Remove ${skillName}`}
 >
 <X className="h-3 w-3 text-muted-foreground" />
 </button>
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm">
 <div className={`h-3 w-3 rounded-full ${colors.dot}`} />
 </div>
 <div className="flex-1 min-w-0 pr-4">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="text-sm font-medium truncate">{skillName}</span>
 </div>
 {category && (
 <p className="text-xs text-muted-foreground mb-2">{category}</p>
 )}
 <div className="flex items-center gap-2">
 <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
 <motion.div
 className={`h-full rounded-full ${colors.bar}`}
 initial={{ width: 0 }}
 animate={{ width: `${proficiency}%` }}
 transition={{ delay: 0.5 + idx * 0.06, duration: 0.8, ease: 'easeOut' as const }}
 />
 </div>
 <span className={`text-xs font-medium ${colors.text} whitespace-nowrap`}>{level}</span>
 </div>
 </div>
 </motion.div>
 )
 })}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground text-center py-4">No skills added yet. Use the form below to add your first skill.</p>
 )}

 <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
 <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill..." className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()} />
 <Select value={newLevel} onValueChange={setNewLevel}>
 <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="beginner">Beginner</SelectItem>
 <SelectItem value="intermediate">Intermediate</SelectItem>
 <SelectItem value="advanced">Advanced</SelectItem>
 <SelectItem value="expert">Expert</SelectItem>
 </SelectContent>
 </Select>
 <Button onClick={handleAddSkill} disabled={!newSkill.trim()} size="icon" className="bg-neutral-900 text-white hover:bg-neutral-800">
 <Plus className="h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 </motion.div>

 {/* Activity Heatmap - using the component from dashboard */}
 <div className="mt-6">
 <ActivityHeatmap />
 </div>

 {/* Achievement Showcase - Top 3 */}
 {topAchievements.length > 0 && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, ease: 'easeOut' as const }} className="mt-6">
 <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="text-base flex items-center gap-2">
 <Trophy className="h-4 w-4" /> Featured Achievements
 </CardTitle>
 <Badge variant="secondary" className="text-xs">{earnedAchievements.length}/12 earned</Badge>
 </div>
 </CardHeader>
 <CardContent>
 <div className="grid gap-4 sm:grid-cols-3">
 {topAchievements.map((ach, i) => {
 const rarity = ach.rarity
 const colors = rarityColorMap[rarity]
 const IconComponent = iconMap[ach.icon] || Star
 return (
 <motion.div
 key={ach.id}
 initial={{ opacity: 0, y: 12, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: 'easeOut' as const }}
 className={`relative rounded-xl border p-4 ${colors.bg} ${colors.border} ${colors.glow} transition-all hover:scale-[1.02]`}
 >
 <div className={`h-10 w-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
 <IconComponent className={`h-5 w-5 ${colors.text}`} />
 </div>
 <h4 className="text-sm font-semibold">{ach.name}</h4>
 <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ach.description}</p>
 <div className="flex items-center justify-between mt-3">
 <Badge variant="outline" className={`text-[10px] ${colors.text} ${colors.border} border capitalize`}>{rarity}</Badge>
 <span className="text-[10px] text-muted-foreground">
 {new Date(ach.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
 </span>
 </div>
 </motion.div>
 )
 })}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* Learning Journey Timeline */}
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, ease: 'easeOut' as const }} className="mt-6">
 <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="text-base flex items-center gap-2">
 <Calendar className="h-4 w-4" /> Recent Activity
 </CardTitle>
 <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
 View all <ArrowRight className="h-3 w-3" />
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {isLoadingTimeline ? (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200/30 border-t-neutral-500" />
 <p className="mt-2 text-sm text-muted-foreground">Loading activity...</p>
 </div>
 ) : timelineItems.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12">
 <Calendar className="mb-2 size-8 text-muted-foreground/40" />
 <p className="text-sm text-muted-foreground">No recent activity</p>
 <p className="mt-1 text-xs text-muted-foreground/70">Start studying or earning achievements to see your activity here.</p>
 </div>
 ) : (
 <div className="relative pl-8">
 {/* Timeline connector */}
 <div className="timeline-line" />

 <div className="space-y-6">
 {timelineItems.map((item, i) => {
 const Icon = item.icon
 return (
 <motion.div
 key={item.id}
 initial={{ opacity: 0, x: -12 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.55 + i * 0.08, duration: 0.35, ease: 'easeOut' as const }}
 className="relative flex gap-4"
 >
 {/* Icon dot */}
 <div className={`absolute -left-8 top-0.5 h-10 w-10 rounded-full ${item.color.split(' ')[1]} border border-border/50 flex items-center justify-center shadow-soft z-10`}>
 <Icon className={`h-4 w-4 ${item.color.split(' ')[0]}`} />
 </div>

 {/* Content */}
 <div className="flex-1 pb-1">
 <div className="flex items-center gap-2 mb-0.5">
 <h4 className="text-sm font-semibold">{item.title}</h4>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
 <p className="text-[11px] text-muted-foreground/60 mt-1">{item.date}</p>
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
 </div>
 )
}
