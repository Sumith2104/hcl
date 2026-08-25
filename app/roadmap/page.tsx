'use client';

import React, { useEffect, useState } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Sparkles, 
  Layers, 
  Clock, 
  ExternalLink, 
  Sliders, 
  RotateCcw, 
  Zap, 
  Award, 
  BookOpen, 
  AlertCircle, 
  Info,
  ChevronRight,
  TrendingUp,
  X,
  MessageSquare,
  Network,
  ListOrdered
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Roadmap, RoadmapItem, RoadmapResource } from '@/lib/db/schema';
import { cn, formatHours } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { RoadmapGraph2D } from '@/components/roadmap-graph-2d';

export default function RoadmapPage() {
  const { user } = useAuth();
  const activeUserId = user?.id || 'usr_demo_101';
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'2d_graph' | 'timeline'>('2d_graph');
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [adaptFeedbackType, setAdaptFeedbackType] = useState<'struggling' | 'too_fast' | 'already_know'>('struggling');
  const [adaptFeedbackText, setAdaptFeedbackText] = useState('');
  const [adapting, setAdapting] = useState(false);
  const [adaptationResultNote, setAdaptationResultNote] = useState<string | null>(null);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/roadmaps/current?userId=${activeUserId}`);
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        if (!selectedItem && data.roadmap.items.length > 0) {
          const inProgress = data.roadmap.items.find((i: RoadmapItem) => i.status === 'in_progress') || data.roadmap.items[0];
          setSelectedItem(inProgress);
        }
      }
    } catch (err) {
      console.error('Error loading roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [activeUserId]);

  const handleToggleStatus = async (item: RoadmapItem) => {
    if (!roadmap) return;
    const nextStatus: RoadmapItem['status'] = item.status === 'completed' ? 'in_progress' : 'completed';

    try {
      const res = await fetch(`/api/roadmaps/${roadmap.id}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success && data.item) {
        if (nextStatus === 'completed') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
        await fetchRoadmap();
      }
    } catch (err) {
      console.error('Error toggling milestone status:', err);
    }
  };

  const handleAdaptRoadmap = async () => {
    if (!roadmap) return;
    setAdapting(true);
    setAdaptationResultNote(null);

    try {
      const res = await fetch('/api/roadmaps/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          userId: activeUserId,
          feedbackType: adaptFeedbackType,
          feedbackText: adaptFeedbackText || `User feedback: ${adaptFeedbackType}`
        })
      });

      const data = await res.json();
      if (data.success && data.data?.roadmap) {
        setRoadmap(data.data.roadmap);
        setAdaptationResultNote(data.data.explanation);
        setShowAdaptModal(false);
        setAdaptFeedbackText('');
      }
    } catch (err) {
      console.error('Error adapting roadmap:', err);
    } finally {
      setAdapting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Compass className="w-8 h-8 text-neutral-900 animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 font-mono">Loading your deterministic roadmap from Fluxbase...</p>
      </div>
    );
  }

  if (!roadmap || !roadmap.items || roadmap.items.length === 0) {
    return (
      <div className="minimal-card p-12 text-center space-y-5 max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-800 mx-auto">
          <Compass className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-neutral-900">No Active Roadmap Found</h2>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
            Complete the conversational AI onboarding to dynamically extract your baseline and generate your personalized 2D DAG roadmap.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <a href="/onboarding" className="btn-black w-full sm:w-auto inline-flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Start AI Onboarding</span>
          </a>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch('/api/onboarding/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    profileData: {
                      target_goal: 'Data Structures & Algorithms in Python',
                      experience_level: 'intermediate',
                      available_hours_per_week: 14,
                      target_duration_weeks: 16,
                      preferred_learning_style: 'hands-on',
                      interests: ['DSA', 'LeetCode', 'Algorithms', 'Python'],
                      current_skills: [{ skill: 'Python Syntax & Logic', level: 'intermediate' }],
                      confidence_assessment: 0.94,
                      summary: 'Data Structures & Algorithms in Python curriculum.'
                    },
                    userId: activeUserId,
                    generateRoadmap: true
                  })
                });
                const data = await res.json();
                if (data.roadmap) {
                  setRoadmap(data.roadmap);
                }
              } catch (err) {
                console.error(err);
              } finally {
                setLoading(false);
              }
            }}
            className="btn-outline w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-neutral-900" />
            <span>⚡ Generate DSA in Python Track</span>
          </button>
        </div>
      </div>
    );
  }

  // Group items by phase
  const phasesMap: Record<number, { title: string; items: RoadmapItem[] }> = {};
  roadmap.items.forEach(item => {
    if (!phasesMap[item.phase]) {
      phasesMap[item.phase] = { title: item.phase_title, items: [] };
    }
    phasesMap[item.phase].items.push(item);
  });

  const totalItems = roadmap.items.length;
  const completedItems = roadmap.items.filter(i => i.status === 'completed').length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-black">Deterministic 2D Knowledge Graph</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
              Fluxbase Synced
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">
            {roadmap.target_role}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl mt-0.5 leading-relaxed">
            {roadmap.target_goal}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* 2D Graph vs Timeline Toggle */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/60 shadow-2xs">
            <button
              onClick={() => setActiveView('2d_graph')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeView === '2d_graph'
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              <Network className="w-3.5 h-3.5 text-neutral-900" />
              <span>2D Branching Graph</span>
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeView === 'timeline'
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              <ListOrdered className="w-3.5 h-3.5 text-neutral-600" />
              <span>Timeline DAG</span>
            </button>
          </div>

          <button
            onClick={() => setShowAdaptModal(true)}
            className="btn-black !text-xs !py-2"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adapt My Path</span>
          </button>
        </div>
      </div>

      {/* Adaptation Notification Banner */}
      {adaptationResultNote && (
        <div className="p-4 rounded-xl bg-neutral-900 text-white flex items-start gap-3 animate-in fade-in">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold">Roadmap Dynamic Adaptation Applied</p>
            <p className="text-neutral-300 leading-relaxed">{adaptationResultNote}</p>
          </div>
        </div>
      )}

      {/* VIEW 1: 2D INTERACTIVE BRANCHING GRAPH */}
      {activeView === '2d_graph' ? (
        <RoadmapGraph2D roadmap={roadmap} onItemSelect={setSelectedItem} />
      ) : (
        /* VIEW 2: TIMELINE SEQUENTIAL DAG */
        <div className="space-y-6">
          {/* Stats Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl minimal-card space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Completion</span>
              <p className="text-xl font-bold text-neutral-900">{progressPct}%</p>
              <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-xl minimal-card space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Total Milestones</span>
              <p className="text-xl font-bold text-neutral-900">{totalItems} modules</p>
              <p className="text-[11px] text-neutral-500 font-mono">{completedItems} completed</p>
            </div>
            <div className="p-4 rounded-xl minimal-card space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Total Hours</span>
              <p className="text-xl font-bold text-neutral-900">{roadmap.total_hours} hrs</p>
              <p className="text-[11px] text-neutral-500 font-mono">~{Math.round(roadmap.total_hours / roadmap.estimated_duration_weeks)} hrs/week</p>
            </div>
            <div className="p-4 rounded-xl minimal-card space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Target Duration</span>
              <p className="text-xl font-bold text-neutral-900">{roadmap.estimated_duration_weeks} weeks</p>
              <p className="text-[11px] text-neutral-500 font-mono">{Object.keys(phasesMap).length} phases</p>
            </div>
          </div>

          {/* Timeline Layout: Timeline DAG (Left 8) + Module Detail Drawer (Right 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Phase & Topological Sequence List */}
            <div className="lg:col-span-8 space-y-6">
              {Object.entries(phasesMap).map(([phaseNum, phaseData]) => (
                <div key={phaseNum} className="space-y-3">
                  {/* Phase Header */}
                  <div className="flex items-center gap-2.5 px-1">
                    <span className="w-5 h-5 rounded-md bg-neutral-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      {phaseNum}
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900">
                      {phaseData.title}
                    </h3>
                  </div>

                  {/* Items List in Phase */}
                  <div className="space-y-2">
                    {phaseData.items.map(item => {
                      const isSelected = selectedItem?.id === item.id;
                      const isCompleted = item.status === 'completed';
                      const isInProgress = item.status === 'in_progress';
                      const isLocked = item.status === 'locked';

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={cn(
                            'p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group',
                            isSelected
                              ? 'bg-neutral-50 border-neutral-900 shadow-sm'
                              : 'bg-white border-neutral-200 hover:border-neutral-300'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Status Checkbox */}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleToggleStatus(item);
                              }}
                              className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : isInProgress
                                  ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                                  : 'bg-neutral-100 text-neutral-400 hover:text-neutral-600 border border-neutral-200'
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isInProgress ? (
                                <Circle className="w-3.5 h-3.5 fill-white" />
                              ) : (
                                <Lock className="w-3 h-3" />
                              )}
                            </button>

                            {/* Title & Metadata */}
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-neutral-500">
                                  #{item.sequence_order}
                                </span>
                                <h4
                                  className={cn(
                                    'text-xs sm:text-sm font-semibold truncate',
                                    isCompleted ? 'line-through text-neutral-400' : 'text-neutral-900'
                                  )}
                                >
                                  {item.skill_name}
                                </h4>
                              </div>
                              <p className="text-xs text-neutral-500 truncate">
                                {item.milestone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-mono text-neutral-500 hidden sm:inline">
                              {formatHours(item.estimated_hours)}
                            </span>
                            <ChevronRight
                              className={cn(
                                'w-4 h-4 text-neutral-400 transition-transform',
                                isSelected ? 'translate-x-0.5 text-neutral-900' : 'group-hover:translate-x-0.5'
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right 4 Cols: Selected Module Detail & Resources */}
            <div className="lg:col-span-4 sticky top-24">
              {selectedItem ? (
                <div className="minimal-card p-5 space-y-4">
                  {/* Module Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-neutral-400">
                        Phase {selectedItem.phase} · Step #{selectedItem.sequence_order}
                      </span>
                      <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                        {selectedItem.skill_name}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase',
                        selectedItem.status === 'completed'
                          ? 'badge-success'
                          : selectedItem.status === 'in_progress'
                          ? 'badge-neutral'
                          : 'badge-locked'
                      )}
                    >
                      {selectedItem.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Estimated Time & Milestone Description */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span>Estimated Investment: <strong>{selectedItem.estimated_hours} hours</strong></span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Milestone Goal</span>
                      <p className="text-neutral-700 leading-relaxed">{selectedItem.milestone}</p>
                    </div>

                    {selectedItem.milestone_project && (
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">Required Capstone</span>
                        <p className="text-neutral-700 leading-relaxed font-mono">{selectedItem.milestone_project}</p>
                      </div>
                    )}

                    {selectedItem.ai_explanation && (
                      <div className="p-3 rounded-xl bg-neutral-100/70 border border-neutral-200/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-900 font-bold text-[10px] uppercase">
                          <Sparkles className="w-3 h-3 text-neutral-800" />
                          <span>AI Prerequisite Rationale</span>
                        </div>
                        <p className="text-neutral-600 text-[11px] leading-relaxed">
                          {selectedItem.ai_explanation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Top-Ranked Learning Resources */}
                  <div className="space-y-2.5 pt-1">
                    <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                      Recommended Learning Resources ({selectedItem.resources.length})
                    </h4>

                    {selectedItem.resources.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No resources attached yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedItem.resources.map((res: RoadmapResource) => (
                          <div
                            key={res.id}
                            className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white transition-all space-y-1.5 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-semibold uppercase">
                                {res.resource?.type || 'interactive'}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-600 font-bold">
                                {Math.round((res.ranking_score || 0.9) * 100)}% Match
                              </span>
                            </div>

                            <h5 className="text-xs font-semibold text-neutral-900 leading-tight">
                              {res.resource?.title || 'Learning Resource'}
                            </h5>

                            {res.recommendation_reason && (
                              <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {res.recommendation_reason}
                              </p>
                            )}

                            {res.resource?.url && (
                              <a
                                href={res.resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-900 hover:underline pt-1"
                              >
                                <span>Open Resource</span>
                                <ExternalLink className="w-3 h-3 text-neutral-500" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Toggle CTA */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleToggleStatus(selectedItem)}
                      className={cn(
                        'w-full btn-black !py-2.5 inline-flex items-center justify-center gap-2',
                        selectedItem.status === 'completed' && '!bg-emerald-600 hover:!bg-emerald-700'
                      )}
                    >
                      {selectedItem.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Milestone Completed</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span>Mark as Completed</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="minimal-card p-6 text-center text-xs text-neutral-400 space-y-2">
                  <Info className="w-5 h-5 mx-auto text-neutral-300" />
                  <p>Select any module on the left to view detailed milestone goals, capstones, and ranked resources.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Adaptation Modal */}
      {showAdaptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-neutral-900" />
                <h3 className="font-bold text-neutral-900 text-sm">Dynamic Path Adaptation</h3>
              </div>
              <button
                onClick={() => setShowAdaptModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Tell the continuous adaptive engine how your learning is progressing. The model will dynamically recalculate your prerequisite milestones.
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-700">What best describes your current state?</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="radio"
                      name="feedbackType"
                      checked={adaptFeedbackType === 'struggling'}
                      onChange={() => setAdaptFeedbackType('struggling')}
                      className="text-neutral-900 focus:ring-neutral-900"
                    />
                    <div>
                      <span className="font-semibold text-neutral-900 block">Struggling with prerequisites</span>
                      <span className="text-[11px] text-neutral-500">Insert guided refresher modules and smaller code drills.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="radio"
                      name="feedbackType"
                      checked={adaptFeedbackType === 'too_fast'}
                      onChange={() => setAdaptFeedbackType('too_fast')}
                      className="text-neutral-900 focus:ring-neutral-900"
                    />
                    <div>
                      <span className="font-semibold text-neutral-900 block">Moving fast / Want deeper challenges</span>
                      <span className="text-[11px] text-neutral-500">Advance toward complex capstone projects and Hard algorithms.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="radio"
                      name="feedbackType"
                      checked={adaptFeedbackType === 'already_know'}
                      onChange={() => setAdaptFeedbackType('already_know')}
                      className="text-neutral-900 focus:ring-neutral-900"
                    />
                    <div>
                      <span className="font-semibold text-neutral-900 block">Already know the current module</span>
                      <span className="text-[11px] text-neutral-500">Fast-forward to next topological milestone.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700">Specific feedback or pain points (optional):</label>
                <textarea
                  value={adaptFeedbackText}
                  onChange={e => setAdaptFeedbackText(e.target.value)}
                  placeholder="e.g. Struggling with graph BFS/DFS recursion in Python..."
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdaptModal(false)}
                className="btn-outline flex-1 !py-2 !text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adapting}
                onClick={handleAdaptRoadmap}
                className="btn-black flex-1 !py-2 !text-xs"
              >
                {adapting ? 'Recalibrating Graph...' : 'Apply Dynamic Adaptation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
