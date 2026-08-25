'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Compass, 
  LayoutDashboard, 
  Bot, 
  ArrowRight, 
  CheckCircle, 
  Target,
  BarChart3,
  GitBranch,
  Network,
  UserPlus,
  LogIn,
  BookOpen,
  Check
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

export default function LandingPage() {
  const { user, loading } = useAuth();

  const highlights = [
    {
      icon: Network,
      title: 'Deterministic Prerequisite Graph',
      description: 'Topological sort algorithm computes precise sequencing with zero hallucinated pathways.'
    },
    {
      icon: Target,
      title: 'Multi-Criteria Resource Ranking',
      description: 'Courses and project assignments scored using composite multi-factor ranking formulas.'
    },
    {
      icon: GitBranch,
      title: 'Adaptive Learning Loop',
      description: 'Dynamic replanning adjusts your path when milestones are completed or when reinforcement is needed.'
    },
    {
      icon: Bot,
      title: '1-on-1 AI Learning Mentor',
      description: 'Personalized interactive tutoring grounded strictly in your active curriculum and milestones.'
    },
    {
      icon: BarChart3,
      title: 'Progress & Skill Radar',
      description: 'Real-time competency tracking, micro-quiz assessments, and interactive capstone project milestones.'
    },
    {
      icon: BookOpen,
      title: 'Fluxbase Cloud Database',
      description: 'PostgreSQL-backed persistence for user profiles, roadmaps, quiz history, and progress analytics.'
    }
  ];

  const roles = [
    'AI Application Engineer',
    'Machine Learning Engineer',
    'Full Stack Web Developer',
    'Cloud & DevOps Architect',
    'Data Scientist',
    'Cybersecurity Specialist'
  ];

  return (
    <div className="space-y-20 py-4 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-10 pb-6">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-800">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
          <span>AI-Powered Adaptive Learning SaaS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 max-w-3xl mx-auto leading-[1.15]">
          Personalized skill mastery with deterministic roadmaps
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          Analyze your current skill baseline, resolve prerequisite dependencies via graph algorithms, and follow an adaptive learning path tailored to your schedule.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="btn-black !px-6 !py-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/roadmap" className="btn-outline !px-6 !py-3">
                <Compass className="w-4 h-4 text-neutral-700" />
                <span>View My Roadmap</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="btn-black !px-6 !py-3">
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-outline !px-6 !py-3">
                <span>Sign In</span>
              </Link>
              <Link href="/onboarding" className="btn-secondary !px-6 !py-3">
                <Sparkles className="w-4 h-4 text-neutral-600" />
                <span>Try Demo Onboarding</span>
              </Link>
            </>
          )}
        </div>

        {/* Role Tags */}
        <div className="pt-8">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">
            Available Role Specializations
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {roles.map(role => (
              <span
                key={role}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-neutral-50 border border-neutral-200/80 text-neutral-700 hover:border-neutral-300 transition-colors"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-6 pt-4 border-t border-neutral-100">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Engineered for Serious Learning
          </h2>
          <p className="text-sm text-neutral-500 max-w-lg mx-auto">
            A reliable, deterministic graph foundation paired with personalized AI tutoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="minimal-card p-6 space-y-3"
              >
                <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200/80 text-neutral-900 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">{item.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works simple flow */}
      <section className="minimal-card p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-neutral-900">How It Works</h3>
          <p className="text-xs text-neutral-500">Three clean steps to your personalized learning roadmap</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center">
              1
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Conversational Onboarding</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tell the AI your background, weekly availability, and career goal in natural language.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center">
              2
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Deterministic Graph Sort</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Our graph engine analyzes your skill gaps and topologically sorts prerequisite courses and milestone projects.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center">
              3
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Adaptive Progress</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Take micro-quizzes, chat with the AI tutor, and request dynamic path adaptations as your skills develop.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
