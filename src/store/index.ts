import { create } from 'zustand'

// ==================== LEARNING GOAL TYPES ====================
export interface LearningGoal {
  id: string
  title: string
  description: string
  deadline: string // ISO date
  progress: number // 0-100
  category: string
  createdAt: string
  completed: boolean
}

// ==================== NOTIFICATION TYPES ====================
export type NotificationType = 'system' | 'reminder' | 'achievement' | 'tip'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: Date
  read: boolean
}

// ==================== VIEW MANAGEMENT ====================
export type AppView =
  | 'landing'
  | 'auth'
  | 'onboarding'
  | 'dashboard'
  | 'roadmap'
  | 'assistant'
  | 'profile'

// ==================== ACHIEVEMENT TYPES ====================
export type AchievementRarity = 'common' | 'great' | 'rare' | 'legendary'
export type AchievementCategory = 'onboarding' | 'learning' | 'streaks' | 'social' | 'mastery'

export interface AchievementDef {
  id: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  icon: string // lucide icon name
  conditionKey: string
  quote: string
}

export interface EarnedAchievement {
  id: string
  achievementId: string
  earnedAt: Date
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your profile setup',
    category: 'onboarding',
    rarity: 'common',
    icon: 'Footprints',
    conditionKey: 'profileComplete',
    quote: 'Every expert was once a beginner.',
  },
  {
    id: 'path-finder',
    name: 'Path Finder',
    description: 'Generate your first learning roadmap',
    category: 'onboarding',
    rarity: 'common',
    icon: 'Compass',
    conditionKey: 'roadmapGenerated',
    quote: 'A journey of a thousand miles begins with a single step.',
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Complete 5 roadmap items',
    category: 'learning',
    rarity: 'great',
    icon: 'BookOpen',
    conditionKey: 'completed5Items',
    quote: 'The beautiful thing about learning is that no one can take it away from you.',
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    category: 'streaks',
    rarity: 'great',
    icon: 'Flame',
    conditionKey: 'streak7',
    quote: 'Consistency is the key to mastery.',
  },
  {
    id: 'chat-initiate',
    name: 'Chat Initiate',
    description: 'Have your first AI assistant conversation',
    category: 'social',
    rarity: 'common',
    icon: 'MessageCircle',
    conditionKey: 'firstChat',
    quote: 'The right question at the right time can change everything.',
  },
  {
    id: 'skill-collector',
    name: 'Skill Collector',
    description: 'Add 10 skills to your profile',
    category: 'mastery',
    rarity: 'great',
    icon: 'Star',
    conditionKey: 'skills10',
    quote: 'Skills are the currency of the 21st century.',
  },
  {
    id: 'phase-champion',
    name: 'Phase Champion',
    description: 'Complete an entire learning phase',
    category: 'learning',
    rarity: 'rare',
    icon: 'Trophy',
    conditionKey: 'phaseComplete',
    quote: 'Champions keep playing until they get it right.',
  },
  {
    id: 'road-scholar',
    name: 'Road Scholar',
    description: 'Complete 50% of your roadmap',
    category: 'learning',
    rarity: 'rare',
    icon: 'GraduationCap',
    conditionKey: 'progress50',
    quote: 'Halfway there — the summit is in sight!',
  },
  {
    id: 'double-digit',
    name: 'Double Digit',
    description: 'Reach 10-day learning streak',
    category: 'streaks',
    rarity: 'rare',
    icon: 'Zap',
    conditionKey: 'streak10',
    quote: 'Ten days strong. You are building something remarkable.',
  },
  {
    id: 'mentors-pet',
    name: "Mentor's Pet",
    description: 'Ask the AI 20 questions',
    category: 'social',
    rarity: 'great',
    icon: 'Sparkles',
    conditionKey: 'questions20',
    quote: 'Curiosity is the engine of achievement.',
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Complete 100% of your roadmap',
    category: 'mastery',
    rarity: 'legendary',
    icon: 'Crown',
    conditionKey: 'progress100',
    quote: 'You did it. The road is behind you, the world is ahead.',
  },
  {
    id: 'path-master',
    name: 'Path Master',
    description: 'Complete your roadmap and add 5+ skills',
    category: 'mastery',
    rarity: 'legendary',
    icon: 'Shield',
    conditionKey: 'masterComplete',
    quote: 'The master has failed more times than the beginner has even tried.',
  },
]

interface AppState {
  // Navigation
  currentView: AppView
  previousView: AppView | null
  setView: (view: AppView) => void
  goBack: () => void

  // Auth
  isAuthenticated: boolean
  user: { id: string; name: string; email: string; role: string } | null
  login: (user: { id: string; name: string; email: string; role: string }) => void
  logout: () => void
  restoreSession: () => boolean

  // Onboarding
  onboardingMessages: { role: string; content: string; step: number }[]
  onboardingStep: number
  addOnboardingMessage: (role: string, content: string) => void
  resetOnboarding: () => void

  // Profile
  profile: {
    targetGoal: string
    experienceLevel: string
    availableHoursPerWeek: number
    preferredLearningStyle: string
    interests: string[]
    targetDurationWeeks: number | null
    onboardingCompleted: boolean
  } | null
  setProfile: (profile: any) => void

  // Roadmap
  roadmap: any | null
  roadmapLoading: boolean
  setRoadmap: (roadmap: any) => void
  setRoadmapLoading: (loading: boolean) => void

  // Chat
  chatMessages: { role: string; content: string; id?: string }[]
  chatLoading: boolean
  addChatMessage: (role: string, content: string) => void
  setChatLoading: (loading: boolean) => void
  clearChat: () => void

  // Dashboard stats
  dashboardStats: {
    overallProgress: number
    currentPhase: number
    totalPhases: number
    completedItems: number
    totalItems: number
    currentSkill: string
    nextMilestone: string
    weeklyGoal: number
    weeklyProgress: number
  }
  setDashboardStats: (stats: any) => void

  // Roles
  availableRoles: string[]
  setAvailableRoles: (roles: string[]) => void

  // Achievements
  earnedAchievements: EarnedAchievement[]
  unlockAchievement: (achievementId: string) => void
  checkAchievements: (context: {
    profileComplete?: boolean
    hasRoadmap?: boolean
    completedItems?: number
    streakDays?: number
    chatMessageCount?: number
    skillCount?: number
    phasesCompleted?: number
    overallProgress?: number
  }) => void

  // Streak
  streakData: {
    streak: number
    longestStreak: number
    activeDays: number
    thisWeekActive: number
    streakHistory: { date: string; active: boolean }[]
  } | null
  setStreakData: (data: {
    streak: number
    longestStreak: number
    activeDays: number
    thisWeekActive: number
    streakHistory: { date: string; active: boolean }[]
  } | null) => void

  // Notifications
  notifications: AppNotification[]
  setNotifications: (notifications: AppNotification[]) => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void
  markAllNotificationsRead: () => void
  markNotificationRead: (id: string) => void
  unreadCount: () => number

  // Learning Goals
  learningGoals: LearningGoal[]
  setLearningGoals: (goals: LearningGoal[]) => void
  addGoal: (goal: Omit<LearningGoal, 'id' | 'createdAt'>) => void
  updateGoalProgress: (id: string, progress: number) => void
  toggleGoalComplete: (id: string) => void
  deleteGoal: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'landing',
  previousView: null,
  setView: (view) => set({ previousView: get().currentView, currentView: view }),
  goBack: () => {
    const prev = get().previousView
    if (prev) set({ currentView: prev, previousView: null })
  },

  // Auth
  isAuthenticated: false,
  user: null,
  login: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_user', JSON.stringify(user))
      localStorage.setItem('sb_auth', '1')
    }
    set({ isAuthenticated: true, user })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sb_user')
      localStorage.removeItem('sb_auth')
    }
    set({
      isAuthenticated: false,
      user: null,
      currentView: 'landing',
      profile: null,
      roadmap: null,
      chatMessages: [],
      onboardingMessages: [],
    })
  },
  restoreSession: () => {
    if (typeof window === 'undefined') return false
    try {
      const auth = localStorage.getItem('sb_auth')
      const userStr = localStorage.getItem('sb_user')
      if (auth === '1' && userStr) {
        const user = JSON.parse(userStr)
        set({ isAuthenticated: true, user })
        return true
      }
    } catch { /* corrupted data, ignore */ }
    return false
  },

  // Onboarding
  onboardingMessages: [],
  onboardingStep: 0,
  addOnboardingMessage: (role, content) =>
    set((state) => ({
      onboardingMessages: [...state.onboardingMessages, { role, content, step: state.onboardingStep }],
      onboardingStep: state.onboardingStep + 1,
    })),
  resetOnboarding: () => set({ onboardingMessages: [], onboardingStep: 0 }),

  // Profile
  profile: null,
  setProfile: (profile) => set({ profile }),

  // Roadmap
  roadmap: null,
  roadmapLoading: false,
  setRoadmap: (roadmap) => set({ roadmap }),
  setRoadmapLoading: (loading) => set({ roadmapLoading: loading }),

  // Chat
  chatMessages: [],
  chatLoading: false,
  addChatMessage: (role, content) =>
    set((state) => ({ chatMessages: [...state.chatMessages, { role, content }] })),
  setChatLoading: (loading) => set({ chatLoading: loading }),
  clearChat: () => set({ chatMessages: [] }),

  // Dashboard
  dashboardStats: {
    overallProgress: 0,
    currentPhase: 1,
    totalPhases: 0,
    completedItems: 0,
    totalItems: 0,
    currentSkill: '',
    nextMilestone: '',
    weeklyGoal: 0,
    weeklyProgress: 0,
  },
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  // Roles
  availableRoles: [],
  setAvailableRoles: (roles) => set({ availableRoles: roles }),

  // Achievements (fetched from DB, start empty)
  earnedAchievements: [],
  setEarnedAchievements: (achievements) => set({ earnedAchievements: achievements }),
  unlockAchievement: (achievementId) =>
    set((state) => {
      const already = state.earnedAchievements.find((a) => a.achievementId === achievementId)
      if (already) return state
      const def = ACHIEVEMENTS.find((a) => a.id === achievementId)
      if (!def) return state
      const newEarned: EarnedAchievement = {
        id: `ea-${Date.now()}`,
        achievementId,
        earnedAt: new Date(),
      }
      // Also persist to DB
      if (state.user?.id) {
        fetch('/api/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: state.user.id, achievementId }),
        }).catch(() => {})
      }
      return {
        earnedAchievements: [...state.earnedAchievements, newEarned],
      }
    }),
  checkAchievements: (context) => {
    const state = get()
    const earned = new Set(state.earnedAchievements.map((a) => a.achievementId))
    const toUnlock: string[] = []

    if (context.profileComplete && !earned.has('first-steps')) toUnlock.push('first-steps')
    if (context.hasRoadmap && !earned.has('path-finder')) toUnlock.push('path-finder')
    if (context.completedItems !== undefined && context.completedItems >= 5 && !earned.has('knowledge-seeker')) toUnlock.push('knowledge-seeker')
    if (context.streakDays !== undefined && context.streakDays >= 7 && !earned.has('week-warrior')) toUnlock.push('week-warrior')
    if (context.chatMessageCount !== undefined && context.chatMessageCount >= 1 && !earned.has('chat-initiate')) toUnlock.push('chat-initiate')
    if (context.skillCount !== undefined && context.skillCount >= 10 && !earned.has('skill-collector')) toUnlock.push('skill-collector')
    if (context.phasesCompleted !== undefined && context.phasesCompleted >= 1 && !earned.has('phase-champion')) toUnlock.push('phase-champion')
    if (context.overallProgress !== undefined && context.overallProgress >= 50 && !earned.has('road-scholar')) toUnlock.push('road-scholar')
    if (context.streakDays !== undefined && context.streakDays >= 10 && !earned.has('double-digit')) toUnlock.push('double-digit')
    if (context.chatMessageCount !== undefined && context.chatMessageCount >= 20 && !earned.has('mentors-pet')) toUnlock.push('mentors-pet')
    if (context.overallProgress !== undefined && context.overallProgress >= 100 && !earned.has('completionist')) toUnlock.push('completionist')
    if (context.overallProgress !== undefined && context.overallProgress >= 100 && context.skillCount !== undefined && context.skillCount >= 5 && !earned.has('path-master')) toUnlock.push('path-master')

    toUnlock.forEach((id) => {
      get().unlockAchievement(id)
    })
  },

  // Streak
  streakData: null,
  setStreakData: (data) => set({ streakData: data }),

  // Notifications (fetched from DB, start empty)
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `n${Date.now()}`,
          read: false,
          timestamp: new Date(),
        },
        ...state.notifications,
      ],
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  unreadCount: () => {
    const state = get()
    return state.notifications.filter((n) => !n.read).length
  },

  // Learning Goals (fetched from DB, start empty)
  learningGoals: [],
  setLearningGoals: (goals) => set({ learningGoals: goals }),
  addGoal: (goal) =>
    set((state) => ({
      learningGoals: [
        ...state.learningGoals,
        {
          ...goal,
          id: `goal-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  updateGoalProgress: (id, progress) =>
    set((state) => ({
      learningGoals: state.learningGoals.map((g) =>
        g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g
      ),
    })),
  toggleGoalComplete: (id) =>
    set((state) => ({
      learningGoals: state.learningGoals.map((g) =>
        g.id === id
          ? { ...g, completed: !g.completed, progress: !g.completed ? 100 : g.progress }
          : g
      ),
    })),
  deleteGoal: (id) =>
    set((state) => ({
      learningGoals: state.learningGoals.filter((g) => g.id !== id),
    })),
}))