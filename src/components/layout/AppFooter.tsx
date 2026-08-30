'use client'

import { useState } from 'react'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { useAppStore } from '@/store'
import { Heart, Github, Twitter, Globe, Linkedin, Send, ArrowRight } from 'lucide-react'
import { StudyBuddiesLogo } from '@/components/icons/StudyBuddiesLogo'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AppFooter() {
  const mounted = useIsMounted()
  const { isAuthenticated, currentView } = useAppStore()
  const isLanding = !isAuthenticated && currentView === 'landing'
  const currentYear = mounted ? new Date().getFullYear() : 2025
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
    setTimeout(() => setSubscribed(false), 3000)
  }

  return (
    <footer className="mt-auto">
      {isLanding ? (
        /* ===== LANDING FOOTER - Clean multi-column ===== */
        <>
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />
          <div className="bg-white dark:bg-[#111318]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
              {/* Newsletter Section */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' as const }}
                className="text-center mb-12"
              >
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Stay ahead of the curve</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Get weekly learning insights, new skill paths, and AI-powered recommendations delivered to your inbox.
                </p>
                <form onSubmit={handleSubscribe} className="flex items-center gap-2 max-w-sm mx-auto">
                  <div className="flex-1 relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-10 pr-4 rounded-md bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-gray-300 dark:focus:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      disabled={subscribed}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-10 px-5 rounded-md bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-300 gap-2 transition-colors"
                    disabled={subscribed}
                  >
                    {subscribed ? (
                      <><span className="text-sm font-medium">Subscribed!</span></>
                    ) : (
                      <><Send className="h-4 w-4" /><span className="hidden sm:inline text-sm font-medium">Subscribe</span></>
                    )}
                  </Button>
                </form>
              </motion.div>

              {/* Multi-column links */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                {/* Column 1: Product */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Product</h4>
                  <ul className="space-y-2.5">
                    {['Features', 'Pricing', 'Integrations', 'Changelog'].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Learning */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Learning</h4>
                  <ul className="space-y-2.5">
                    {['Skill Paths', 'Roadmaps', 'AI Assistant', 'Resources'].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: Company */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Company</h4>
                  <ul className="space-y-2.5">
                    {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 4: Legal */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal</h4>
                  <ul className="space-y-2.5">
                    {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom row: branding + socials + tagline */}
              <div className="pt-8 border-t border-black/[0.06] dark:border-white/[0.06]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  {/* Logo + tagline */}
                  <div className="flex items-center gap-3">
                    <div className="text-gray-700 dark:text-gray-300">
                      <StudyBuddiesLogo size={18} />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Study Buddies</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                        Built with <span className="animate-heart-beat"><Heart className="h-3 w-3 text-gray-400 fill-gray-400" /></span> and AI
                      </p>
                    </div>
                  </div>

                  {/* Social icons - all gray */}
                  <div className="flex items-center gap-2">
                    {[
                      { icon: Github, label: 'GitHub' },
                      { icon: Twitter, label: 'Twitter' },
                      { icon: Linkedin, label: 'LinkedIn' },
                      { icon: Globe, label: 'Discord' },
                    ].map((social) => {
                      const Icon = social.icon
                      return (
                        <motion.a
                          key={social.label}
                          href="#"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                          className="h-8 w-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          aria-label={social.label}
                        >
                          <Icon className="h-4 w-4" />
                        </motion.a>
                      )
                    })}
                  </div>
                </div>

                {/* Copyright */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <span>© {currentYear} Study Buddies. All rights reserved.</span>
                  <span className="flex items-center gap-1.5">
                    Deterministic skill graphs + AI-powered adaptation
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ===== APP FOOTER - Compact ===== */
        <>
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, ease: 'easeOut' as const }}
            className="mx-auto max-w-7xl px-4 sm:px-6 py-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Branding */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="text-gray-400 dark:text-gray-500">
                  <StudyBuddiesLogo size={13} />
                </div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Study Buddies</span>
                <span className="text-gray-300 dark:text-gray-600">v1.0.0</span>
              </div>

              {/* Key links */}
              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                {['Dashboard', 'Roadmap', 'AI Assistant', 'Profile'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>

              {/* Copyright */}
              <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                Built with <span className="animate-heart-beat"><Heart className="h-3 w-3 text-gray-400 fill-gray-400" /></span> & AI
                <span className="text-gray-300 dark:text-gray-600">·</span>
                © {currentYear}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </footer>
  )
}
