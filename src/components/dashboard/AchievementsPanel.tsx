'use client'

import { useState } from 'react'
import { useAppStore, ACHIEVEMENTS, type AchievementDef, type AchievementRarity } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog'
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from '@/components/ui/tooltip'
import {
 Footprints, Compass, BookOpen, Flame, MessageCircle,
 Star, Trophy, GraduationCap, Zap, Sparkles, Crown,
 Shield, Lock, CheckCircle2, Share2, Award,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ==================== ICON MAP ====================
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
 Footprints,
 Compass,
 BookOpen,
 Flame,
 MessageCircle,
 Star,
 Trophy,
 GraduationCap,
 Zap,
 Sparkles,
 Crown,
 Shield,
}

// ==================== RARITY CONFIG ====================
const rarityConfig: Record<AchievementRarity, {
 label: string
 borderColor: string
 glowColor: string
 badgeBg: string
 badgeText: string
 iconBg: string
 iconColor: string
 shimmer: boolean
 animGlow: boolean
}> = {
 common: {
 label: 'Common',
 borderColor: 'border-gray-200/60',
 glowColor: '',
 badgeBg: 'bg-gray-100',
 badgeText: 'text-gray-500',
 iconBg: 'bg-gray-200',
 iconColor: 'text-gray-500',
 shimmer: false,
 animGlow: false,
 },
 great: {
 label: 'Great',
 borderColor: 'border-gray-200/40',
 glowColor: '',
 badgeBg: 'bg-gray-100',
 badgeText: 'text-gray-800',
 iconBg: 'bg-gray-200',
 iconColor: 'text-gray-700',
 shimmer: false,
 animGlow: false,
 },
 rare: {
 label: 'Rare',
 borderColor: 'border-gray-300/50',
 glowColor: '',
 badgeBg: 'bg-gray-100',
 badgeText: 'text-gray-700',
 iconBg: 'bg-gray-200',
 iconColor: 'text-gray-600',
 shimmer: false,
 animGlow: false,
 },
 legendary: {
 label: 'Legendary',
 borderColor: 'border-gray-400/50',
 glowColor: '',
 badgeBg: 'bg-gray-200',
 badgeText: 'text-gray-800',
 iconBg: 'bg-gray-200',
 iconColor: 'text-gray-700',
 shimmer: false,
 animGlow: false,
 },
}

// ==================== CATEGORY CONFIG ====================
const categoryConfig: Record<string, { label: string; color: string }> = {
 onboarding: { label: 'Onboarding', color: 'bg-gray-300' },
 learning: { label: 'Learning', color: 'bg-gray-300' },
 streaks: { label: 'Streaks', color: 'bg-gray-300' },
 social: { label: 'Social', color: 'bg-gray-300' },
 mastery: { label: 'Mastery', color: 'bg-gray-300' },
}

// ==================== PROGRESS CALC ====================
function getAchievementProgress(def: AchievementDef, stats: any, userSkills: any[]): { current: number; target: number; percent: number } {
 const { dashboardStats, chatMessages, profile, roadmap } = stats
 switch (def.conditionKey) {
 case 'profileComplete':
 return profile?.onboardingCompleted ? { current: 1, target: 1, percent: 100 } : { current: 0, target: 1, percent: 0 }
 case 'roadmapGenerated':
 return roadmap ? { current: 1, target: 1, percent: 100 } : { current: 0, target: 1, percent: 0 }
 case 'completed5Items':
 return { current: dashboardStats.completedItems, target: 5, percent: Math.min(100, (dashboardStats.completedItems / 5) * 100) }
 case 'streak7':
 return { current: 7, target: 7, percent: 100 } // mock streak is 7
 case 'firstChat':
 return { current: chatMessages.length, target: 1, percent: Math.min(100, (chatMessages.length / 1) * 100) }
 case 'skills10':
 return { current: userSkills.length, target: 10, percent: Math.min(100, (userSkills.length / 10) * 100) }
 case 'phaseComplete':
 return { current: 0, target: 1, percent: 0 } // would need phase tracking
 case 'progress50':
 return { current: dashboardStats.overallProgress, target: 50, percent: Math.min(100, (dashboardStats.overallProgress / 50) * 100) }
 case 'streak10':
 return { current: 7, target: 10, percent: Math.min(100, (7 / 10) * 100) } // mock streak is 7
 case 'questions20':
 return { current: chatMessages.length, target: 20, percent: Math.min(100, (chatMessages.length / 20) * 100) }
 case 'progress100':
 return { current: dashboardStats.overallProgress, target: 100, percent: dashboardStats.overallProgress }
 case 'masterComplete':
 return { current: 0, target: 1, percent: 0 }
 default:
 return { current: 0, target: 1, percent: 0 }
 }
}

// ==================== DATE FORMAT ====================
function formatDate(date: Date): string {
 return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ==================== ACHIEVEMENT BADGE CARD ====================
function AchievementBadge({
 def,
 earned,
 earnedAt,
 progress,
 onClick,
}: {
 def: AchievementDef
 earned: boolean
 earnedAt?: Date
 progress: { current: number; target: number; percent: number }
 onClick: () => void
}) {
 const rarity = rarityConfig[def.rarity]
 const category = categoryConfig[def.category]
 const IconComp = iconMap[def.icon] || Star

 return (
 <TooltipProvider delayDuration={300}>
 <Tooltip>
 <TooltipTrigger asChild>
 <motion.div
 whileHover={{ scale: 1.03, y: -2 }}
 whileTap={{ scale: 0.98 }}
 className="group cursor-pointer"
 onClick={onClick}
 >
 <Card
 className={`relative overflow-hidden h-full bg-white/60 backdrop-blur-xl transition-all duration-300 ${
 earned
 ? `${rarity.borderColor} border-2 shadow-sm`
 : 'border border-gray-200/40 opacity-70 grayscale'
 }`}
 >
 {/* Shimmer overlay for earned badges */}
 {earned && rarity.shimmer && (
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20" />
 </div>
 )}

 {/* Checkmark overlay for earned */}
 {earned && (
 <div className="absolute top-2 right-2 z-10">
 <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center">
 <CheckCircle2 className="h-3.5 w-3.5 text-gray-700" />
 </div>
 </div>
 )}

 {/* Lock overlay for locked */}
 {!earned && (
 <div className="absolute top-2 right-2 z-10">
 <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
 <Lock className="h-3 w-3 text-gray-400" />
 </div>
 </div>
 )}

 <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
 {/* Icon Circle */}
 <div className={`relative h-14 w-14 rounded-full flex items-center justify-center transition-colors ${
 earned ? rarity.iconBg : 'bg-gray-100'
 }`}>
 <IconComp className={`h-6 w-6 ${earned ? rarity.iconColor : 'text-gray-400'}`} />
 {earned && rarity.animGlow && (
 <div className="absolute inset-0 rounded-full animate-ping opacity-10 bg-gray-300" />
 )}
 </div>

 {/* Name */}
 <h4 className={`text-sm font-bold leading-tight ${earned ? 'text-foreground' : 'text-gray-400'}`}>
 {def.name}
 </h4>

 {/* Description */}
 <p className="text-[11px] leading-snug text-gray-600 line-clamp-2">
 {def.description}
 </p>

 {/* Rarity Badge */}
 <Badge
 variant="outline"
 className={`text-[10px] font-semibold px-2 py-0 h-5 ${
 earned
 ? `${rarity.badgeBg} ${rarity.badgeText} border-transparent`
 : 'bg-gray-100 text-gray-500 border-transparent'
 }`}
 >
 {rarity.label}
 </Badge>

 {/* Date or Locked */}
 <p className="text-[10px] text-gray-500">
 {earned && earnedAt ? formatDate(earnedAt) : 'Locked'}
 </p>

 {/* Progress bar for locked/ partially completed */}
 {!earned && progress.percent > 0 && progress.percent < 100 && (
 <div className="w-full mt-1">
 <Progress value={progress.percent} className="h-1.5" />
 <p className="text-[10px] text-gray-500 mt-0.5">
 {progress.current}/{progress.target}
 </p>
 </div>
 )}

 {/* Category dot */}
 <div className="flex items-center gap-1.5">
 <span className={`h-1.5 w-1.5 rounded-full ${category.color}`} />
 <span className="text-[10px] text-gray-500">{category.label}</span>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </TooltipTrigger>
 <TooltipContent side="top" className="text-xs">
 <p className="font-medium">{def.name}</p>
 <p className="text-muted-foreground">{def.description}</p>
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )
}

// ==================== ACHIEVEMENT DETAIL DIALOG ====================
function AchievementDetailDialog({
 def,
 earnedAt,
 open,
 onOpenChange,
}: {
 def: AchievementDef
 earnedAt?: Date
 open: boolean
 onOpenChange: (open: boolean) => void
}) {
 const rarity = rarityConfig[def.rarity]
 const category = categoryConfig[def.category]
 const IconComp = iconMap[def.icon] || Star

 const handleShare = () => {
 toast.success('Link copied to clipboard!')
 }

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader className="items-center text-center pb-2">
 <DialogTitle className="sr-only">Achievement: {def.name}</DialogTitle>
 </DialogHeader>

 <div className="flex flex-col items-center text-center gap-4">
 {/* Animated Icon */}
 <motion.div
 initial={{ scale: 0, rotate: -180 }}
 animate={{ scale: 1, rotate: 0 }}
 transition={{ type: 'spring', stiffness: 200, damping: 15 }}
 className={`relative h-20 w-20 rounded-full flex items-center justify-center ${rarity.iconBg}`}
 >
 <IconComp className={`h-9 w-9 ${rarity.iconColor}`} />
 </motion.div>

 {/* Name */}
 <motion.h3
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.15 }}
 className="text-xl font-bold"
 >
 {def.name}
 </motion.h3>

 {/* Rarity Badge */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 >
 <Badge className={`${rarity.badgeBg} ${rarity.badgeText} border-transparent font-semibold`}>
 {rarity.label}
 </Badge>
 </motion.div>

 {/* Category */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.25 }}
 className="flex items-center gap-1.5"
 >
 <span className={`h-2 w-2 rounded-full ${category.color}`} />
 <span className="text-sm text-gray-600">{category.label}</span>
 </motion.div>

 {/* Description */}
 <motion.p
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="text-sm text-gray-600 max-w-xs"
 >
 {def.description}
 </motion.p>

 {/* Date Earned */}
 {earnedAt && (
 <motion.p
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.35 }}
 className="text-xs text-gray-500"
 >
 Earned on {formatDate(earnedAt)}
 </motion.p>
 )}

 {/* Motivational Quote */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="rounded-lg bg-muted/60 border border-border/40 px-4 py-3 max-w-xs"
 >
 <p className="text-xs italic text-gray-600 leading-relaxed">
 &ldquo;{def.quote}&rdquo;
 </p>
 </motion.div>

 {/* Share Button */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.45 }}
 >
 <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
 <Share2 className="h-3.5 w-3.5" />
 Share Achievement
 </Button>
 </motion.div>
 </div>
 </DialogContent>
 </Dialog>
 )
}

// ==================== ACHIEVEMENTS PANEL ====================
export function AchievementsPanel({ userSkills }: { userSkills: any[] }) {
 const { earnedAchievements, dashboardStats, chatMessages, profile, roadmap } = useAppStore()
 const [selectedAchievement, setSelectedAchievement] = useState<AchievementDef | null>(null)
 const [dialogOpen, setDialogOpen] = useState(false)

 const earnedSet = new Set(earnedAchievements.map((ea) => ea.achievementId))

 const handleBadgeClick = (def: AchievementDef) => {
 if (earnedSet.has(def.id)) {
 setSelectedAchievement(def)
 setDialogOpen(true)
 }
 }

 const selectedEarned = selectedAchievement
 ? earnedAchievements.find((ea) => ea.achievementId === selectedAchievement.id)
 : null

 // Sort achievements: earned first (by date desc), then locked
 const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
 const aEarned = earnedSet.has(a.id)
 const bEarned = earnedSet.has(b.id)
 if (aEarned && !bEarned) return -1
 if (!aEarned && bEarned) return 1
 if (aEarned && bEarned) {
 const aDate = earnedAchievements.find((e) => e.achievementId === a.id)?.earnedAt?.getTime() || 0
 const bDate = earnedAchievements.find((e) => e.achievementId === b.id)?.earnedAt?.getTime() || 0
 return bDate - aDate
 }
 // Sort locked by rarity: legendary > rare > great > common
 const rarityOrder: Record<string, number> = { legendary: 0, rare: 1, great: 2, common: 3 }
 return (rarityOrder[a.rarity] || 3) - (rarityOrder[b.rarity] || 3)
 })

 const earnedCount = earnedSet.size
 const totalCount = ACHIEVEMENTS.length

 const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: { staggerChildren: 0.06 },
 },
 }

 const itemVariants = {
 hidden: { opacity: 0, y: 20, scale: 0.95 },
 visible: { opacity: 1, y: 0, scale: 1 },
 }

 return (
 <>
 <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
 <CardHeader className="pb-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
 <Award className="h-4.5 w-4.5 text-gray-600" />
 </div>
 <div>
 <CardTitle className="text-base font-semibold">Achievements</CardTitle>
 <p className="text-xs text-gray-500 mt-0.5">
 {earnedCount}/{totalCount} unlocked
 </p>
 </div>
 </div>
 <Badge
 variant="outline"
 className="font-semibold bg-gray-100 text-gray-800 border-gray-200"
 >
 {Math.round((earnedCount / totalCount) * 100)}%
 </Badge>
 </div>
 </CardHeader>
 <CardContent>
 {/* Overall progress bar */}
 <div className="mb-5">
 <Progress value={(earnedCount / totalCount) * 100} className="h-2" />
 </div>

 {/* Badge Grid */}
 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
 >
 {sortedAchievements.map((def) => {
 const isEarned = earnedSet.has(def.id)
 const earnedEntry = isEarned
 ? earnedAchievements.find((ea) => ea.achievementId === def.id)
 : null
 const progress = getAchievementProgress(def, { dashboardStats, chatMessages, profile, roadmap }, userSkills)

 return (
 <motion.div key={def.id} variants={itemVariants}>
 <AchievementBadge
 def={def}
 earned={isEarned}
 earnedAt={earnedEntry?.earnedAt}
 progress={progress}
 onClick={() => handleBadgeClick(def)}
 />
 </motion.div>
 )
 })}
 </motion.div>

 {/* Legend */}
 <div className="mt-5 pt-4 border-t border-gray-200/40">
 <div className="flex flex-wrap items-center gap-3 justify-center">
 {(Object.keys(rarityConfig) as AchievementRarity[]).map((r) => {
 const cfg = rarityConfig[r]
 return (
 <div key={r} className="flex items-center gap-1.5">
 <span className={`h-2.5 w-2.5 rounded-full ${
 r === 'common'
 ? 'bg-gray-300'
 : r === 'great'
 ? 'bg-gray-400'
 : r === 'rare'
 ? 'bg-gray-500'
 : 'bg-gray-700'
 }`} />
 <span className="text-[10px] text-gray-500 font-medium">{cfg.label}</span>
 </div>
 )
 })}
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Detail Dialog */}
 {selectedAchievement && (
 <AchievementDetailDialog
 def={selectedAchievement}
 earnedAt={selectedEarned?.earnedAt}
 open={dialogOpen}
 onOpenChange={setDialogOpen}
 />
 )}
 </>
 )
}