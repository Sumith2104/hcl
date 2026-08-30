'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface SkillExplorerPanelProps {
  className?: string
}

interface Skill {
  name: string
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  proficiency: number
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; hover: string }> = {
  Frontend: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-400',
    hover: 'hover:border-gray-300',
  },
  Backend: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-500',
    hover: 'hover:border-gray-300',
  },
  'Data Science': {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-400',
    hover: 'hover:border-gray-300',
  },
  DevOps: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-500',
    hover: 'hover:border-gray-300',
  },
  'AI/ML': {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-400',
    hover: 'hover:border-gray-300',
  },
  Mobile: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-500',
    hover: 'hover:border-gray-300',
  },
  Security: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-500',
    hover: 'hover:border-gray-300',
  },
  'System Design': {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-400',
    hover: 'hover:border-gray-300',
  },
  'Soft Skills': {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    bar: 'bg-gray-500',
    hover: 'hover:border-gray-300',
  },
}

const LEVELS: ('Beginner' | 'Intermediate' | 'Advanced')[] = ['Beginner', 'Intermediate', 'Advanced']

const PROFICIENCY_OPTIONS = [25, 50, 75, 100]

// Seeded pseudo-random for consistent initial proficiency per skill
function seededProficiency(index: number): number {
  return PROFICIENCY_OPTIONS[index % PROFICIENCY_OPTIONS.length]
}

function seededLevel(index: number): 'Beginner' | 'Intermediate' | 'Advanced' {
  return LEVELS[index % LEVELS.length]
}

const SKILL_DATA: { category: string; skills: string[] }[] = [
  {
    category: 'Frontend',
    skills: ['HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Next.js', 'Tailwind CSS', 'Web Performance', 'Accessibility'],
  },
  {
    category: 'Backend',
    skills: ['Node.js', 'Python', 'Java', 'Go', 'REST APIs', 'GraphQL', 'Databases (SQL)', 'Databases (NoSQL)', 'Caching', 'Message Queues'],
  },
  {
    category: 'Data Science',
    skills: ['Statistics', 'Python', 'Pandas', 'NumPy', 'Data Visualization', 'SQL', 'Machine Learning Basics', 'Feature Engineering', 'A/B Testing'],
  },
  {
    category: 'DevOps',
    skills: ['Git', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Networking', 'Monitoring', 'Terraform', 'Nginx'],
  },
  {
    category: 'AI/ML',
    skills: ['Python', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'MLOps', 'Prompt Engineering'],
  },
  {
    category: 'Mobile',
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Mobile UX', 'App Performance', 'Push Notifications', 'Offline-First'],
  },
  {
    category: 'Security',
    skills: ['Network Security', 'Application Security', 'Cryptography', 'OWASP', 'Penetration Testing', 'Compliance', 'Identity Management', 'Incident Response'],
  },
  {
    category: 'System Design',
    skills: ['Scalability', 'Microservices', 'Load Balancing', 'Caching Strategies', 'Database Design', 'API Design', 'Event-Driven Architecture', 'Distributed Systems'],
  },
  {
    category: 'Soft Skills',
    skills: ['Technical Writing', 'Code Review', 'Agile/Scrum', 'System Design Interview', 'Communication', 'Mentoring', 'Time Management', 'Problem Solving'],
  },
]

// Build flat skill list with stable initial state
const ALL_SKILLS: Skill[] = SKILL_DATA.flatMap((group) =>
  group.skills.map((name, i) => {
    const globalIndex = SKILL_DATA.slice(0, SKILL_DATA.indexOf(group)).reduce((sum, g) => sum + g.skills.length, 0) + i
    return {
      name,
      category: group.category,
      level: seededLevel(globalIndex),
      proficiency: seededProficiency(globalIndex),
    }
  })
)

const categories = SKILL_DATA.map((g) => g.category)

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.03,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

export default function SkillExplorerPanel({ className }: SkillExplorerPanelProps) {
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [skillStates, setSkillStates] = useState<Record<string, Skill>>(
    () => Object.fromEntries(ALL_SKILLS.map((s) => [`${s.category}:${s.name}`, { ...s }]))
  )

  const handleLevelChange = (key: string, level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setSkillStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], level },
    }))
  }

  const filteredSkills = useMemo(() => {
    let skills = Object.values(skillStates)
    if (activeTab !== 'All') {
      skills = skills.filter((s) => s.category === activeTab)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      skills = skills.filter((s) => s.name.toLowerCase().includes(query))
    }
    return skills
  }, [activeTab, searchQuery, skillStates])

  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return ALL_SKILLS.length
    return ALL_SKILLS.filter((s) => s.category === cat).length
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Category Tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto">
            <TabsTrigger value="All" className="gap-1.5">
              All
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {getCategoryCount('All')}
              </Badge>
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="gap-1.5">
                {cat}
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                  {getCategoryCount(cat)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Single content area shared across all tabs */}
          <TabsContent value={activeTab} forceMount className="mt-4">
            {filteredSkills.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
                  <Search className="size-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">No skills found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search or filter to find what you&apos;re looking for.
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {filteredSkills.map((skill, index) => {
                    const key = `${skill.category}:${skill.name}`
                    const colors = CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS.Frontend
                    return (
                      <motion.div
                        key={key}
                        custom={index}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                      >
                        <Card
                          className={cn(
                            'py-4 transition-colors duration-200 cursor-default bg-white/60 backdrop-blur-sm border border-gray-200/50',
                            colors.hover
                          )}
                        >
                          <CardContent className="px-4 pb-0 pt-0 space-y-3">
                            {/* Header: Name + Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-sm leading-tight">{skill.name}</h3>
                              <Badge
                                variant="outline"
                                className={cn('shrink-0 text-[10px] px-1.5 py-0 border', colors.bg, colors.text, colors.border)}
                              >
                                {skill.category}
                              </Badge>
                            </div>

                            {/* Level Selector Pills */}
                            <div className="flex gap-1.5">
                              {LEVELS.map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => handleLevelChange(key, lvl)}
                                  className={cn(
                                    'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors border',
                                    skill.level === lvl
                                      ? 'border-transparent text-white bg-gray-600'
                                      : 'border-border text-muted-foreground hover:bg-muted'
                                  )}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>Proficiency</span>
                                <span>{skill.proficiency}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className={cn('h-full rounded-full', colors.bar)}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${skill.proficiency}%` }}
                                  transition={{ duration: 0.6, delay: index * 0.03 + 0.15, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
