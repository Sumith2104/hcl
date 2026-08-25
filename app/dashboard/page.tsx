'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Target, 
  Award, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Compass, 
  RotateCcw, 
  ShieldCheck, 
  Zap,
  Play,
  HelpCircle,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Roadmap, RoadmapItem, AssessmentQuiz } from '@/lib/db/schema';
import { cn, formatHours } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';

export default function DashboardPage() {
  const { user } = useAuth();
  const activeUserId = user?.id || 'usr_demo_101';
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<AssessmentQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/roadmaps/current?userId=${activeUserId}`);
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeUserId]);

  const handleLaunchQuiz = async (skillId: string) => {
    try {
      const res = await fetch(`/api/progress/assessment?skillId=${skillId}`);
      const data = await res.json();
      if (data.quiz) {
        setActiveQuiz(data.quiz);
        setQuizAnswers(new Array(data.quiz.questions.length).fill(-1));
        setQuizResult(null);
      }
    } catch (err) {
      console.error('Error launching quiz:', err);
    }
  };

  const handleAnswerSelect = (qIdx: number, choiceIdx: number) => {
    const updated = [...quizAnswers];
    updated[qIdx] = choiceIdx;
    setQuizAnswers(updated);
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);

    try {
      const res = await fetch('/api/progress/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          skillId: activeQuiz.skill_id,
          answers: quizAnswers
        })
      });
      const data = await res.json();
      setQuizResult(data);

      if (data.passed) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <LayoutDashboard className="w-8 h-8 text-neutral-900 animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 font-mono">Loading your learning velocity & progress...</p>
      </div>
    );
  }

  const items = roadmap?.items || [];
  const inProgressItem = items.find(i => i.status === 'in_progress') || items.find(i => i.status !== 'completed') || items[0];
  const completedCount = stats?.completedCount || 0;
  const totalCount = stats?.totalCount || items.length || 1;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-neutral">Personalized Learning Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-1">
            Welcome back, {user?.name || 'Alex Rivera'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Target Goal: <span className="font-semibold text-neutral-900">{roadmap?.target_role || 'AI Application Engineer'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/roadmap" className="btn-black !text-xs !py-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Open Roadmap DAG</span>
          </Link>
          <Link href="/assistant" className="btn-outline !text-xs !py-2">
            <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
            <span>AI Mentor</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Completion */}
        <div className="p-5 rounded-2xl minimal-card space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Roadmap Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-neutral-900">{percentage}%</p>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">{completedCount} of {totalCount} modules finished</p>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        {/* Total Hours Invested */}
        <div className="p-5 rounded-2xl minimal-card space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Study Hours Logged</span>
            <Clock className="w-4 h-4 text-neutral-700" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-neutral-900">{stats?.totalHours || 60}h</p>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">{stats?.estimatedHoursRemaining || 48}h planned remaining</p>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${Math.min(100, Math.round(((stats?.totalHours || 12) / 60) * 100))}%` }} />
          </div>
        </div>

        {/* Verified Skills Count */}
        <div className="p-5 rounded-2xl minimal-card space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Verified Skills</span>
            <Award className="w-4 h-4 text-neutral-700" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-neutral-900">
              {stats?.skillProficiencies?.filter((s: any) => s.proficiency_level !== 'beginner').length || 4}
            </p>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">Topological Graph Verified</p>
          </div>
        </div>

        {/* Database Status */}
        <div className="p-5 rounded-2xl minimal-card space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Fluxbase Cloud DB</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900 font-mono">CONNECTED</p>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">PostgreSQL Engine</p>
          </div>
        </div>
      </div>

      {/* Active Milestone Card */}
      {inProgressItem && (
        <div className="minimal-card p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="badge-black">Active Milestone</span>
              <span className="text-xs text-neutral-500 font-mono">Phase {inProgressItem.phase} · Module #{inProgressItem.sequence_order}</span>
            </div>
            <button
              onClick={() => handleLaunchQuiz(inProgressItem.skill_id)}
              className="btn-outline !py-1.5 !px-3 !text-xs self-start sm:self-auto"
            >
              <HelpCircle className="w-3.5 h-3.5 text-neutral-700" />
              <span>Test with Micro-Quiz</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-2">
              <h3 className="text-lg font-bold text-neutral-900">{inProgressItem.skill_name}</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {inProgressItem.milestone}
              </p>
              {inProgressItem.ai_explanation && (
                <p className="text-xs text-neutral-500 italic bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
                  Rationale: {inProgressItem.ai_explanation}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Target Capstone</span>
              <p className="text-xs font-semibold text-neutral-900 leading-relaxed">
                {inProgressItem.milestone_project}
              </p>
              <div className="pt-2">
                <Link href="/roadmap" className="btn-black w-full !text-xs !py-2">
                  <span>View Curated Lessons</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills Matrix Table */}
      <div className="minimal-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-neutral-900" />
            <h3 className="text-sm font-bold text-neutral-900">Skill Competency Matrix</h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">Fluxbase Canonical Taxonomy</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {stats?.skillProficiencies?.map((sp: any) => (
            <div
              key={sp.skill_id}
              className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 truncate">{sp.skill_name}</span>
                <span className="badge-neutral !text-[10px] uppercase font-semibold capitalize">
                  {sp.proficiency_level}
                </span>
              </div>
              <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-900 rounded-full"
                  style={{
                    width: sp.proficiency_level === 'expert' ? '100%' : sp.proficiency_level === 'advanced' ? '80%' : sp.proficiency_level === 'intermediate' ? '60%' : '30%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Micro-Quiz Assessment Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="minimal-card p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="badge-black">Skill Assessment</span>
                <h3 className="text-base font-bold text-neutral-900 mt-1">{activeQuiz.skill_name} Micro-Quiz</h3>
              </div>
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {activeQuiz.questions.map((q, qIdx) => (
                <div key={q.id} className="space-y-2.5">
                  <p className="text-xs sm:text-sm font-semibold text-neutral-900">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = quizAnswers[qIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleAnswerSelect(qIdx, oIdx)}
                          className={cn(
                            'w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2.5',
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                              : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-neutral-300'
                          )}
                        >
                          <span className={cn(
                            'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono shrink-0',
                            isSelected ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'
                          )}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Result Display */}
            {quizResult && (
              <div className={cn(
                'p-4 rounded-xl text-xs space-y-1 border',
                quizResult.passed ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
              )}>
                <p className="font-bold text-sm">
                  {quizResult.passed ? '✓ Assessment Passed!' : 'Needs Review'} ({quizResult.score}%)
                </p>
                <p className="leading-relaxed">{quizResult.feedback}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => setActiveQuiz(null)}
                className="flex-1 btn-outline"
              >
                Close
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={submittingQuiz || quizAnswers.includes(-1)}
                className="flex-1 btn-black"
              >
                {submittingQuiz ? 'Evaluating...' : 'Submit Answers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
