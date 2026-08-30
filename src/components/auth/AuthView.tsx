'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Loader2, AlertTriangle, WifiOff, Eye, EyeOff, Shield, Check } from 'lucide-react'
import { StudyBuddiesIcon } from '@/components/icons/StudyBuddiesLogo'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
]

export function AuthView() {
  const { setView, login } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const clearError = () => setServerError(null)

  const passwordChecks = useMemo(() => {
    if (tab !== 'signup' || !password) return PASSWORD_REQUIREMENTS.map(r => ({ ...r, met: false }))
    return PASSWORD_REQUIREMENTS.map(r => ({ ...r, met: r.test(password) }))
  }, [tab, password])

  const allRequirementsMet = passwordChecks.every(c => c.met)

  const handleSignUp = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (!email.trim()) { toast.error('Please enter your email'); return }
    if (!email.includes('@') || !email.includes('.')) { toast.error('Please enter a valid email'); return }
    if (!password) { toast.error('Please enter a password'); return }
    if (!allRequirementsMet) { toast.error('Please meet all password requirements'); return }

    setLoading(true)
    clearError()
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', name: name.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (data.error) {
        setServerError(data.error)
        return
      }
      login({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role })
      toast.success(`Welcome, ${data.user.name}!`)
      setView('onboarding')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setServerError(msg)
    }
    finally { setLoading(false) }
  }

  const handleLogin = async () => {
    if (!loginEmail.trim()) { toast.error('Please enter your email'); return }
    if (!loginPassword) { toast.error('Please enter your password'); return }

    setLoading(true)
    clearError()
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail.trim(), password: loginPassword }),
      })
      const data = await res.json()
      if (data.error) {
        setServerError(data.error)
        return
      }
      login({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role })
      toast.success(`Welcome back, ${data.user.name}!`)
      if (data.hasProfile) setView('dashboard')
      else setView('onboarding')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setServerError(msg)
    }
    finally { setLoading(false) }
  }

  const isNetworkError = serverError && (
    serverError.includes('timed out') ||
    serverError.includes('network') ||
    serverError.includes('connect') ||
    serverError.includes('Network error') ||
    serverError.includes('fetch')
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white relative">
      {/* Subtle decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-gray-100/50 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-gray-100/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gray-50/80 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        {/* Back button - minimal text + arrow */}
        <button
          onClick={() => setView('landing')}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </button>

        {/* Glass morphism card */}
        <Card className="glass-card rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8 px-8">
            <div className="mx-auto mb-4 text-gray-800">
              <StudyBuddiesIcon size={48} />
            </div>
            <CardTitle className="text-2xl text-gray-900 font-semibold tracking-tight">
              Welcome to Study Buddies
            </CardTitle>
            <CardDescription className="text-gray-500 mt-1">
              Your AI-powered learning journey starts here
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8">
            {/* Server Error Banner */}
            {serverError && (
              <Alert
                variant={isNetworkError ? 'destructive' : 'default'}
                className={`mb-4 ${!isNetworkError ? 'border-red-200 bg-red-50 text-red-800' : ''}`}
              >
                {isNetworkError ? <WifiOff className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>{isNetworkError ? 'Connection Error' : 'Something went wrong'}</AlertTitle>
                <AlertDescription className="text-sm break-words">{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Underline-style tab switcher */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => { setTab('signup'); clearError() }}
                className={`flex-1 pb-3 text-sm font-medium text-center transition-colors relative ${
                  tab === 'signup'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Sign Up
                {tab === 'signup' && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setTab('login'); clearError() }}
                className={`flex-1 pb-3 text-sm font-medium text-center transition-colors relative ${
                  tab === 'login'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Log In
                {tab === 'login' && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {/* Sign Up Tab */}
            <AnimatePresence mode="wait">
              {tab === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-gray-700 text-sm">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                      className="border-gray-200 bg-white/60 focus-visible:ring-gray-300 focus-visible:border-gray-400 h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-gray-700 text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                      className="border-gray-200 bg-white/60 focus-visible:ring-gray-300 focus-visible:border-gray-400 h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                        className="pr-10 border-gray-200 bg-white/60 focus-visible:ring-gray-300 focus-visible:border-gray-400 h-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator - gray tones */}
                  <AnimatePresence>
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500">Password Requirements</span>
                          </div>
                          <div className="space-y-1.5">
                            {passwordChecks.map((check) => (
                              <div key={check.label} className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors duration-200 ${check.met ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                  {check.met && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <span className={`text-xs transition-colors duration-200 ${check.met ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                  {check.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Log In Tab */}
              {tab === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-gray-700 text-sm">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="john@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="border-gray-200 bg-white/60 focus-visible:ring-gray-300 focus-visible:border-gray-400 h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-gray-700 text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="pr-10 border-gray-200 bg-white/60 focus-visible:ring-gray-300 focus-visible:border-gray-400 h-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-2">
            <Button
              className="w-full bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 h-10 font-medium transition-colors"
              variant="outline"
              onClick={tab === 'signup' ? handleSignUp : handleLogin}
              disabled={loading || (tab === 'signup' && !allRequirementsMet && password.length > 0)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500" />}
              {tab === 'signup' ? 'Create Account' : 'Log In'}
            </Button>
          </CardFooter>
        </Card>

        {/* Subtle footer text */}
        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  )
}
