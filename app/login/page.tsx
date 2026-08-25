'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Failed to sign in. Please check your credentials.');
    }
  };

  const handleDemoFill = () => {
    setEmail('alex.rivera@example.com');
    setPassword('demo123');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white mx-auto flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Sign In to AdaptiveLearn
          </h1>
          <p className="text-xs text-neutral-500">
            Access your personalized learning roadmap and dashboard
          </p>
        </div>

        {/* Minimal White Card */}
        <div className="minimal-card p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex.rivera@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 minimal-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 minimal-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-black !py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="pt-3 border-t border-neutral-100 text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs text-neutral-600 hover:text-neutral-900 font-medium underline transition-colors"
            >
              ⚡ Fill Demo Account (Alex Rivera)
            </button>
          </div>
        </div>

        {/* Switch to Signup */}
        <p className="text-center text-xs text-neutral-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-neutral-900 font-semibold underline hover:text-neutral-700">
            Sign Up Free
          </Link>
        </p>
      </div>
    </div>
  );
}
