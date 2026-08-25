'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Target, 
  BookOpen, 
  Layers, 
  Zap, 
  Loader2, 
  Cpu, 
  ChevronRight,
  RotateCcw,
  Terminal,
  Activity
} from 'lucide-react';
import { ExtractedProfileData } from '@/lib/ai/goal_analyzer';
import { useAuth } from '@/lib/auth/context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ tool: string; args: any; result?: any }>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const activeUserId = user?.id || 'usr_demo_101';
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I'm your AI Learning Architect. To craft your personalized, deterministic learning path on Fluxbase, tell me:\n\n1. What role or career goal are you aiming for (e.g. Machine Learning Engineer, AI Engineer, Fullstack)?\n2. What is your current technical background and skills?\n3. How many hours per week can you comfortably dedicate?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState<any[]>([]);
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfileData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  const quickTracks = [
    {
      label: 'Machine Learning & MLOps Track',
      text: 'I want to become a Machine Learning Engineer. I have intermediate Python and statistical background, and want to master Deep Learning, PyTorch, and MLOps pipelines over 14 hours/week for 16 weeks.'
    },
    {
      label: 'AI Application Engineer Track',
      text: 'I want to become an AI Application Engineer. I have intermediate Python and basic SQL knowledge, and want to learn LLM prompt engineering, RAG, and AWS deployment over 14 hours/week for 16 weeks.'
    },
    {
      label: 'Full Stack Next.js & Cloud Track',
      text: 'I want to become a Full Stack Developer. I have experience with JavaScript & HTML/CSS, and want to master TypeScript, Next.js, and cloud deployment over 12 weeks.'
    }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text || loading || generating) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Execute Agentic reasoning loop with live Fluxbase database tool calling
      const chatRes = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, userId: activeUserId })
      });
      const chatData = await chatRes.json();

      if (chatData.reply) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: chatData.reply,
            toolCalls: chatData.toolCalls
          }
        ]);
      }

      if (chatData.extractedProfile) {
        setExtractedProfile(chatData.extractedProfile);
      }

      if (chatData.steps) {
        setAgentSteps(chatData.steps);
      }
    } catch (err) {
      console.error('Error in onboarding turn:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!extractedProfile || generating) return;

    setGenerating(true);
    setGenerationProgress(20);
    setGenerationStatus('Validating profile schema in Fluxbase...');

    try {
      await new Promise(r => setTimeout(r, 500));
      setGenerationProgress(50);
      setGenerationStatus(`Computing skill gaps for ${extractedProfile.target_goal}...`);

      await new Promise(r => setTimeout(r, 500));
      setGenerationProgress(75);
      setGenerationStatus('Topological sorting prerequisite DAG graph...');

      // Call complete onboarding API
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: extractedProfile,
          userId: activeUserId,
          generateRoadmap: true
        })
      });

      setGenerationProgress(95);
      setGenerationStatus('Persisting sequenced roadmap to Fluxbase database...');
      const data = await res.json();

      if (data.success && data.roadmap) {
        setGenerationProgress(100);
        await new Promise(r => setTimeout(r, 400));
        router.push('/roadmap');
      } else {
        throw new Error(data.error || 'Roadmap generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setGenerating(false);
      setGenerationStatus(`Error: ${(err as Error).message}`);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Hello ${user?.name || 'there'}! I'm your AI Learning Architect. To craft your personalized, deterministic learning path on Fluxbase, tell me:\n\n1. What role or career goal are you aiming for (e.g. Machine Learning Engineer, AI Engineer, Fullstack)?\n2. What is your current technical background and skills?\n3. How many hours per week can you comfortably dedicate?`
      }
    ]);
    setExtractedProfile(null);
    setAgentSteps([]);
    setInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-neutral-900 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Agentic AI Conversational Onboarding
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Autonomous agent analyzing your background, calling Fluxbase database tools, and building your DAG roadmap.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="btn-outline !py-1.5 !px-3 !text-xs self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
          <span>Reset Conversation</span>
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat Conversation */}
        <div className="lg:col-span-7 space-y-4">
          <div className="minimal-card p-4 sm:p-6 space-y-4 min-h-[480px] flex flex-col justify-between">
            {/* Messages Scroll Area */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    m.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                      m.role === 'user'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                    }`}
                  >
                    {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className="space-y-1.5 max-w-[85%]">
                    <div
                      className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-neutral-900 text-white rounded-tr-none'
                          : 'bg-neutral-100/90 text-neutral-900 rounded-tl-none border border-neutral-200/80'
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Agentic Tool Calls Badge */}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {m.toolCalls.map((tc, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-50 border border-neutral-200 text-[10px] font-mono text-neutral-600"
                          >
                            <Terminal className="w-3 h-3 text-neutral-900" />
                            <span>{tc.tool}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-neutral-500 text-xs font-mono py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-900" />
                  <span>Agent is executing Fluxbase database queries & analyzing profile...</span>
                </div>
              )}
            </div>

            {/* Quick Track Options */}
            {messages.length === 1 && (
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
                  Quick Track Presets:
                </p>
                <div className="flex flex-col gap-1.5">
                  {quickTracks.map((qt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(qt.text)}
                      className="text-left p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-xs font-medium text-neutral-800 transition-colors flex items-center justify-between group"
                    >
                      <span>{qt.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input Box */}
            <div className="pt-2 border-t border-neutral-100">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Describe your learning goal (e.g. I want to learn machine learning so create roadmap)..."
                  disabled={loading || generating}
                  className="flex-1 minimal-input"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim() || generating}
                  className="btn-black !p-2.5"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Live Profile Extraction & Graph Generator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="minimal-card p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-neutral-900" />
                <h3 className="text-sm font-bold text-neutral-900">Extracted Profile</h3>
              </div>
              {extractedProfile ? (
                <span className="badge-success">Agentic Synced</span>
              ) : (
                <span className="text-[11px] text-neutral-400 font-mono">Listening</span>
              )}
            </div>

            {extractedProfile ? (
              <div className="space-y-4 text-xs">
                {/* Target Role & Goal */}
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Target Role & Goal</span>
                  <p className="font-bold text-neutral-900 text-sm">{extractedProfile.target_goal}</p>
                  {extractedProfile.summary && (
                    <p className="text-neutral-600 text-xs leading-relaxed">{extractedProfile.summary}</p>
                  )}
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-0.5">
                    <span className="text-neutral-400 text-[10px] block uppercase">Experience</span>
                    <span className="font-semibold text-neutral-900 capitalize">{extractedProfile.experience_level}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-0.5">
                    <span className="text-neutral-400 text-[10px] block uppercase">Hours / Week</span>
                    <span className="font-semibold text-neutral-900">{extractedProfile.available_hours_per_week} hrs/wk</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-0.5">
                    <span className="text-neutral-400 text-[10px] block uppercase">Style</span>
                    <span className="font-semibold text-neutral-900 capitalize">{extractedProfile.preferred_learning_style}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-0.5">
                    <span className="text-neutral-400 text-[10px] block uppercase">Target Weeks</span>
                    <span className="font-semibold text-neutral-900">{extractedProfile.target_duration_weeks} wks</span>
                  </div>
                </div>

                {/* Extracted Skills */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Identified Baseline Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedProfile.current_skills.map((s, idx) => (
                      <span key={idx} className="badge-neutral">
                        {s.skill} ({s.level})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Generate Roadmap Button */}
                <div className="pt-2">
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={generating}
                    className="w-full btn-black !py-3 shadow-md"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Roadmap...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Build Deterministic Roadmap</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Type your background in the chat or pick a quick track to automatically populate your verified profile.
                </p>
              </div>
            )}

            {/* Generation Progress Bar */}
            {generating && (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-700 font-medium">{generationStatus}</span>
                  <span className="text-neutral-900 font-bold">{generationProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
