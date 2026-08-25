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
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Roadmap, RoadmapItem, RoadmapResource } from '@/lib/db/schema';
import { cn, formatHours } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';

export default function RoadmapPage() {
  const { user } = useAuth();
  const activeUserId = user?.id || 'usr_demo_101';
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
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
          userNotes: adaptFeedbackText || `User indicated: ${adaptFeedbackType}`
        })
      });

      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
        setAdaptationResultNote(data.explanation);
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
            Complete the conversational AI onboarding to dynamically extract your baseline and generate your personalized DAG roadmap.
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
                      target_goal: 'Machine Learning Engineer',
                      experience_level: 'intermediate',
                      available_hours_per_week: 14,
                      target_duration_weeks: 16,
                      preferred_learning_style: 'hands-on',
                      interests: ['Machine Learning', 'Deep Learning', 'PyTorch', 'MLOps'],
                      current_skills: [{ skill: 'Python Programming', level: 'intermediate' }],
                      confidence_assessment: 0.92,
                      summary: 'Machine Learning Engineer track calibrated for intermediate Python.'
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
            <span>Generate ML Track</span>
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
      {/* Top Header & Adapt CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-black">Deterministic DAG</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">
            {roadmap.target_role}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl mt-0.5 leading-relaxed">
            {roadmap.target_goal}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
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

      {/* Main Content Layout: Timeline DAG (Left 8) + Module Detail Drawer (Right 4) */}
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
                        {/* Status Checkbox / Icon */}
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
                            {isInProgress && (
                              <span className="badge-black !text-[9px]">Active</span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 truncate max-w-md">
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
                            'w-4 h-4 transition-transform',
                            isSelected ? 'text-neutral-900 translate-x-0.5' : 'text-neutral-400 group-hover:text-neutral-700'
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

        {/* Right 4 Cols: Selected Milestone Detail Drawer */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          {selectedItem ? (
            <div className="minimal-card p-5 sm:p-6 space-y-5">
              {/* Header */}
              <div className="border-b border-neutral-100 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="badge-neutral">
                    Phase {selectedItem.phase} · Step #{selectedItem.sequence_order}
                  </span>
                  <span className={cn(
                    'text-xs font-semibold capitalize',
                    selectedItem.status === 'completed' ? 'text-emerald-700' : selectedItem.status === 'in_progress' ? 'text-neutral-900' : 'text-neutral-400'
                  )}>
                    {selectedItem.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 mt-1">
                  {selectedItem.skill_name}
                </h3>
              </div>

              {/* AI Explanation of Why this is next */}
              {selectedItem.ai_explanation && (
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-800">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
                    <span>DAG Sequence Rationale</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {selectedItem.ai_explanation}
                  </p>
                </div>
              )}

              {/* Hands-On Capstone Project */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                  <Award className="w-3 h-3 text-neutral-900" />
                  <span>Required Milestone Project</span>
                </span>
                <div className="p-3 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-800 leading-relaxed shadow-sm">
                  {selectedItem.milestone_project}
                </div>
              </div>

              {/* Curated Ranked Learning Resources */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-neutral-900" />
                  <span>Curated Learning Resources ({selectedItem.resources?.length || 0})</span>
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedItem.resources && selectedItem.resources.length > 0 ? (
                    selectedItem.resources.map(resBinding => {
                      const r = resBinding.resource;
                      const title = r?.title || `Resource ${resBinding.resource_id}`;
                      const desc = resBinding.recommendation_reason || r?.description || 'Recommended learning module';
                      const url = r?.url || '#';
                      const meta = r ? `${r.platform} · ${r.difficulty} · ${r.estimated_hours}h` : 'Self-paced';

                      return (
                        <div
                          key={resBinding.id}
                          className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5 hover:border-neutral-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-bold text-neutral-900 line-clamp-1">{title}</h5>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800 font-semibold shrink-0">
                              Score: {Math.round(resBinding.ranking_score * 100)}%
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                            {desc}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {meta}
                            </span>
                            {url !== '#' && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-semibold text-neutral-900 hover:underline flex items-center gap-1"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-neutral-400 text-center py-4">
                      No external resources linked.
                    </p>
                  )}
                </div>
              </div>

              {/* Status Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleToggleStatus(selectedItem)}
                  className="w-full btn-black !py-2.5"
                >
                  {selectedItem.status === 'completed' ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Mark In Progress</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Milestone Complete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="minimal-card p-8 text-center space-y-2">
              <Info className="w-6 h-6 text-neutral-400 mx-auto" />
              <p className="text-xs text-neutral-500">Select any milestone node in the sequence to inspect resources.</p>
            </div>
          )}
        </div>
      </div>

      {/* Adapt My Path Modal */}
      {showAdaptModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="minimal-card p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">Adapt My Learning Path</h3>
              </div>
              <button
                onClick={() => setShowAdaptModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Our graph engine will recalibrate remaining phases without breaking completed milestones.
            </p>

            {/* Feedback Option Pills */}
            <div className="space-y-2">
              {[
                { type: 'struggling', label: 'I am struggling with recent concepts', desc: 'Inject prerequisite reinforcement modules' },
                { type: 'too_fast', label: 'Pacing is too slow / I already know this', desc: 'Fast-track through introductory content' },
                { type: 'already_know', label: 'Pivot focus to more hands-on code projects', desc: 'Shift weight to project capstones' }
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => setAdaptFeedbackType(opt.type as any)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border transition-all space-y-0.5',
                    adaptFeedbackType === opt.type
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-900 border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className={cn(
                    'text-[11px]',
                    adaptFeedbackType === opt.type ? 'text-neutral-300' : 'text-neutral-500'
                  )}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">Specific feedback (optional)</label>
              <textarea
                value={adaptFeedbackText}
                onChange={e => setAdaptFeedbackText(e.target.value)}
                placeholder="e.g. Need more practical Python examples..."
                rows={2}
                className="w-full minimal-input resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowAdaptModal(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAdaptRoadmap}
                disabled={adapting}
                className="flex-1 btn-black"
              >
                {adapting ? 'Recalibrating...' : 'Apply Adaptation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
