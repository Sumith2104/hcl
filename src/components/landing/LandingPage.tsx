'use client'

import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Target,
  Brain,
  BarChart3,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Zap,
  GraduationCap,
  Route,
  RefreshCw,
  Users,
  BookOpen,
  Heart,
  Quote,
  Star,
  ChevronRight,
  Lightbulb,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { ParticleCanvas } from './ParticleCanvas'

const features = [
  {
    icon: Brain,
    title: 'AI Conversational Onboarding',
    description: 'No tedious forms. Chat naturally with AI that understands your goals and current expertise.',
  },
  {
    icon: Target,
    title: 'Deterministic Skill Gap Analysis',
    description: 'Graph-based dependency analysis and topological sort, not AI hallucination. Know exactly what you need.',
  },
  {
    icon: Route,
    title: 'Personalized Roadmaps',
    description: 'AI-generated learning phases with real milestones, curated resources, and realistic timelines.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Track completion, assessment scores, and learning velocity. See your growth over time.',
  },
  {
    icon: MessageSquare,
    title: 'AI Learning Mentor',
    description: 'Ask questions, get explanations, receive guidance. Your AI tutor knows your roadmap and progress.',
  },
  {
    icon: RefreshCw,
    title: 'Adaptive Learning',
    description: 'Struggling? The AI adds prerequisites. Excelling? Skip ahead to advanced topics. Your path evolves.',
  },
]

const howItWorks = [
  {
    step: 1,
    title: 'Chat with AI',
    description: 'Tell us your goals and current skills through a natural conversation.',
    icon: MessageSquare,
  },
  {
    step: 2,
    title: 'Skill Analysis',
    description: 'Our engine identifies exact gaps using deterministic graph algorithms.',
    icon: Brain,
  },
  {
    step: 3,
    title: 'Get Your Roadmap',
    description: 'AI generates a phased learning plan with curated resources and milestones.',
    icon: Route,
  },
  {
    step: 4,
    title: 'Learn & Adapt',
    description: 'Track progress, chat with your AI mentor, and watch your path adapt to you.',
    icon: GraduationCap,
  },
]

const roles = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Analyst', 'Data Scientist', 'Machine Learning Engineer',
  'AI Engineer', 'DevOps Engineer', 'Cybersecurity Analyst',
]

const stats = [
  { icon: Users, value: 10000, suffix: '+', label: 'Learners', tooltip: 'And growing every day' },
  { icon: Route, value: 500, suffix: '+', label: 'Learning Paths Created', tooltip: 'Across 9 tech roles' },
  { icon: BookOpen, value: 60, suffix: '+', label: 'Tech Skills Covered', tooltip: 'In our curated skill graph' },
  { icon: Heart, value: 95, suffix: '%', label: 'Learner Satisfaction', tooltip: 'Based on user feedback' },
]

const testimonials = [
  {
    text: "Study Buddies's skill gap analysis was spot-on. It identified React Hooks as my weakness before I even realized it.",
    author: 'Sarah Chen',
    role: 'Frontend Developer',
    rating: 5,
    initials: 'SC',
  },
  {
    text: "The adaptive learning feature is incredible. When I struggled with TypeScript, it automatically added prerequisite modules.",
    author: 'Marcus Johnson',
    role: 'Full Stack Developer',
    rating: 5,
    initials: 'MJ',
  },
  {
    text: 'I went from junior to mid-level in 6 months following my Study Buddies roadmap. The AI mentor was like having a senior dev available 24/7.',
    author: 'Priya Patel',
    role: 'Backend Developer',
    rating: 5,
    initials: 'PP',
  },
]

const faqs = [
  {
    question: 'How is Study Buddies different from ChatGPT or other AI learning tools?',
    answer: 'Study Buddies combines deterministic skill graph analysis with AI. While other tools generate generic advice, we use topological sort on a curated skill dependency graph to create structured, auditable learning paths. The AI handles natural language explanations, not factual computation.',
  },
  {
    question: 'Is my learning data private?',
    answer: "Yes. Your profile, skills, and progress data stays on your device in a local database. We don't share your learning data with third parties.",
  },
  {
    question: 'Can I customize my learning path after it\'s generated?',
    answer: "Absolutely. You can regenerate your roadmap at any time, update your skills as you progress, and the AI will adapt your path based on your actual learning velocity.",
  },
  {
    question: 'What tech roles does Study Buddies support?',
    answer: 'We support 9 popular tech roles including Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, ML Engineer, AI Engineer, DevOps Engineer, Cybersecurity Analyst, and Data Analyst.',
  },
  {
    question: 'How does the adaptive learning engine work?',
    answer: 'When you update your progress, our engine analyzes your learning velocity. If you\'re struggling with a topic, it adds prerequisite skills. If you\'re excelling, it suggests advanced topics. Every adaptation is logged and explained.',
  },
]

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  const animate = useCallback(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    const duration = 2000
    const startTime = performance.now()
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setCount(target)
      }
    }
    requestAnimationFrame(step)
  }, [target])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [animate])

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

function useInViewSteps() {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set())
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    stepRefs.current.forEach((el, i) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSteps((prev) => new Set([...prev, i]))
            obs.disconnect()
          }
        },
        { threshold: 0.5 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return { visibleSteps, stepRefs }
}

export function LandingPage() {
  const { setView } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const { visibleSteps, stepRefs } = useInViewSteps()

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-24 bg-white">
        <ParticleCanvas />
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-gray-100/60 blur-3xl float-orb-1" />
          <div className="absolute top-40 right-1/4 h-80 w-80 rounded-full bg-gray-50/60 blur-3xl float-orb-2" />
          <div className="absolute bottom-10 left-1/2 h-56 w-56 rounded-full bg-gray-100/40 blur-3xl float-orb-3" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut' as const }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              AI-Powered Learning Paths
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
              Your Personal AI{' '}
              <span className="text-gray-500">
                Learning Mentor
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-gray-500 mb-10 leading-relaxed">
              Not just another roadmap generator. Study Buddies understands your goals, identifies real skill gaps
              through deterministic analysis, creates personalized learning paths, and adapts as you progress.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-8 h-12 text-base shadow-sm"
                onClick={() => setView('auth')}
              >
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 h-12 text-base border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                See How It Works
              </Button>
            </div>
          </motion.div>
          <motion.div
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' as const }}
          >
            <p className="text-sm text-gray-400 mb-4">Learning paths for popular tech roles:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="outline" className="px-3 py-1 text-xs font-normal border-gray-200 text-gray-500">
                  {role}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-12 sm:py-16 bg-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  className="text-center stat-tooltip-trigger relative group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const }}
                >
                  <div className="stat-tooltip">{stat.tooltip}</div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-gray-50/50 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <motion.div className="text-center mb-12 sm:mb-16" {...fadeIn} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built Like a Real Product, Not a Demo
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Deterministic skill analysis, AI-generated explanations, structured data — never just vibes.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const }}
                >
                  <Card className="bg-white/60 backdrop-blur-md border border-gray-200/60 hover:-translate-y-1 hover:border-gray-300/80 transition-all duration-300 h-full shadow-sm hover:shadow-md group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition-colors duration-300">
                          <Icon className="h-6 w-6" />
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 hover-arrow transition-colors duration-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div className="text-center mb-12 sm:mb-16" {...fadeIn} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How Study Buddies Works
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Four steps from ambition to a structured, adaptive learning plan.
            </p>
          </motion.div>
          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5">
              <div className="w-full h-full bg-gray-200 opacity-60" />
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item, i) => {
                const Icon = item.icon
                const isVisible = visibleSteps.has(i)
                return (
                  <motion.div
                    key={item.step}
                    ref={(el) => { stepRefs.current[i] = el }}
                    className="relative text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' as const }}
                  >
                    <div className="relative inline-flex mb-4">
                      {isVisible && (
                        <div className="absolute inset-0 rounded-full border-2 border-gray-200/40 step-node-pulse" />
                      )}
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-600 border-2 border-gray-200">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="absolute -top-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold shadow-sm">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div className="text-center mb-12 sm:mb-16" {...fadeIn} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Developers
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Real stories from developers who transformed their careers with Study Buddies.
            </p>
          </motion.div>
          {/* Desktop: show all 3 */}
          <div className="grid gap-6 md:grid-cols-3 hidden md:grid">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' as const }}
              >
                <Card className="bg-white/60 backdrop-blur-md border border-gray-200/60 h-full shadow-sm">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-gray-300 mb-4" />
                    <p className="text-sm text-gray-500 italic leading-relaxed mb-4">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-gray-300 text-gray-300" />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                        {testimonial.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{testimonial.author}</p>
                        <p className="text-xs text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {/* Mobile carousel */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: 'easeInOut' as const }}
                className="testimonial-enter"
              >
                <Card className="bg-white/60 backdrop-blur-md border border-gray-200/60 shadow-sm">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-gray-300 mb-4" />
                    <p className="text-sm text-gray-500 italic leading-relaxed mb-4">
                      &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                    </p>
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-gray-300 text-gray-300" />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                        {testimonials[activeTestimonial].initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{testimonials[activeTestimonial].author}</p>
                        <p className="text-xs text-gray-400">{testimonials[activeTestimonial].role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`carousel-dot ${idx === activeTestimonial ? 'carousel-dot-active' : ''}`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Differentiator */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ease: 'easeOut' as const }}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Structured Knowledge,{' '}
                <span className="text-gray-500">Not Vibes</span>
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Most AI roadmap generators are a thin prompt wrapper. Study Buddies treats the LLM as one component
                in a deterministic, auditable system.
              </p>
              <div className="space-y-4">
                {[
                  'Skills & prerequisites live in a real dependency graph',
                  'Skill-gap analysis uses graph algorithms (topological sort)',
                  'LLM handles natural language, not factual computation',
                  'Every AI output validated against database before display',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ease: 'easeOut' as const }}
              className="bg-white/60 backdrop-blur-md border border-gray-200/60 rounded-2xl p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                <Zap className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">AI Pipeline</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Goal Extraction', type: 'AI' },
                  { label: 'Skill Normalization', type: 'DB' },
                  { label: 'Skill Gap Analysis', type: 'Deterministic' },
                  { label: 'Prerequisite Ordering', type: 'Deterministic' },
                  { label: 'Roadmap Generation', type: 'AI' },
                  { label: 'Resource Matching', type: 'Scored' },
                  { label: 'Explanation Text', type: 'AI' },
                ].map((step) => (
                  <div key={step.label} className="flex items-center justify-between rounded-lg bg-white/80 p-3 border border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{step.label}</span>
                    <Badge variant="secondary" className={`text-xs bg-gray-100 text-gray-600 border border-gray-200`}>
                      {step.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div className="text-center mb-12 sm:mb-16" {...fadeIn} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about Study Buddies and how it works.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' as const }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-gray-200">
                  <AccordionTrigger className="text-left text-base font-medium text-gray-800 hover:text-gray-900 transition-colors hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            className="text-center rounded-2xl bg-gray-50 border border-gray-200/60 p-8 sm:p-12 lg:p-16 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ ease: 'easeOut' as const }}
          >
            {/* Subtle dot pattern overlay */}
            <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
            {/* Floating decorative elements - subtle gray */}
            <div className="absolute top-8 left-8 opacity-10 floating-decor-1">
              <Lightbulb className="h-8 w-8 text-gray-400" />
            </div>
            <div className="absolute top-16 right-12 opacity-8 floating-decor-2">
              <Zap className="h-6 w-6 text-gray-400" />
            </div>
            <div className="absolute bottom-12 left-16 opacity-8 floating-decor-3">
              <Sparkles className="h-7 w-7 text-gray-400" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Ready to Learn Smarter?
              </h2>
              <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
                Start your personalized learning journey today. Your AI mentor is ready to guide you.
              </p>
              <Button
                size="lg"
                className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm px-8 h-12 text-base font-semibold rounded-xl"
                onClick={() => setView('auth')}
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
