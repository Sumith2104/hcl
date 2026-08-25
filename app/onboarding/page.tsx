'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  PanelRightOpen,
  PanelRightClose,
  Copy,
  Check
} from 'lucide-react';
import { ExtractedProfileData } from '@/lib/ai/goal_analyzer';
import { useAuth } from '@/lib/auth/context';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ tool: string; args: any; result?: any }>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const activeUserId = user?.id || 'usr_demo_101';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I'm your **AI Learning Architect** powered by AWS Bedrock & Fluxbase.

To construct your personalized, deterministic prerequisite learning path, tell me:
1. **What career goal or role** are you aiming for (e.g. *Machine Learning Engineer, AI Application Engineer, Full Stack Developer*)?
2. **What is your current technical background** (e.g. *know Python, beginner in math, etc.*)?
3. **How many hours per week** can you comfortably dedicate?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState<any[]>([]);
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfileData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  const quickPrompts = [
    {
      title: 'Machine Learning & MLOps Track',
      prompt: 'I want to become a Machine Learning Engineer. I know basic Python and statistics. I have 14 hours/week for 16 weeks.'
    },
    {
      title: 'AI Application Engineer',
      prompt: 'I want to build Generative AI & RAG apps with Python, LangChain, and AWS Bedrock over 12 weeks.'
    },
    {
      title: 'Full Stack Web Developer',
      prompt: 'I want to master Next.js App Router, TypeScript, and PostgreSQL database architecture from scratch.'
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text || loading || generating) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
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
      await new Promise(r => setTimeout(r, 450));
      setGenerationProgress(50);
      setGenerationStatus(`Computing skill gaps for ${extractedProfile.target_goal}...`);

      await new Promise(r => setTimeout(r, 450));
      setGenerationProgress(75);
      setGenerationStatus('Topological sorting prerequisite DAG graph...');

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
        await new Promise(r => setTimeout(r, 350));
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
        content: `Hello ${user?.name || 'there'}! I'm your **AI Learning Architect** powered by AWS Bedrock & Fluxbase.

To construct your personalized, deterministic prerequisite learning path, tell me:
1. **What career goal or role** are you aiming for (e.g. *Machine Learning Engineer, AI Application Engineer, Full Stack Developer*)?
2. **What is your current technical background** (e.g. *know Python, beginner in math, etc.*)?
3. **How many hours per week** can you comfortably dedicate?`
      }
    ]);
    setExtractedProfile(null);
    setAgentSteps([]);
    setInput('');
  };

  const copyMessage = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[880px] relative">
      {/* Top ChatGPT-style Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-neutral-900 tracking-tight">
                AI Learning Architect
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[10px] font-mono font-medium text-neutral-600">
                AWS Bedrock · Claude 3.5
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Conversational profiling with live Fluxbase database tool calling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-xs",
              drawerOpen
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
            )}
          >
            {drawerOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Profile & DAG</span>
            {extractedProfile && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-500 transition-colors"
            title="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace (Split View: Chat + Collapsible Profile Panel) */}
      <div className="flex-1 flex gap-4 min-h-0 relative overflow-hidden">
        {/* Left/Center: ChatGPT Style Chat View */}
        <div className="flex-1 flex flex-col justify-between minimal-card p-0 overflow-hidden bg-white">
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 group",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs",
                      m.role === 'user'
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-900 border border-neutral-200"
                    )}
                  >
                    {m.role === 'user' ? (
                      user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                    ) : (
                      <Sparkles className="w-4 h-4 text-neutral-800" />
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div className="space-y-1.5 max-w-[85%] sm:max-w-[80%]">
                    <div
                      className={cn(
                        "rounded-2xl p-4 text-xs sm:text-sm leading-relaxed",
                        m.role === 'user'
                          ? "bg-neutral-900 text-white rounded-tr-none shadow-sm"
                          : "bg-neutral-50/90 text-neutral-900 rounded-tl-none border border-neutral-200/80 shadow-xs"
                      )}
                    >
                      {m.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                    </div>

                    {/* Agentic Tool Calls Bar */}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {m.toolCalls.map((tc, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-[10px] font-mono text-neutral-600"
                          >
                            <Terminal className="w-3 h-3 text-neutral-900" />
                            <span>{tc.tool}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Message Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyMessage(idx, m.content)}
                        className="text-[10px] text-neutral-400 hover:text-neutral-700 flex items-center gap-1"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-900">
                    <Sparkles className="w-4 h-4 text-neutral-800 animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 rounded-tl-none flex items-center gap-2.5 text-xs text-neutral-500 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-900" />
                    <span>AWS Bedrock agent executing reasoning loop & Fluxbase queries...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky Bottom Prompt Bar (ChatGPT Style) */}
          <div className="p-4 border-t border-neutral-100 bg-white">
            <div className="max-w-3xl mx-auto space-y-2.5">
              {/* Quick Starter Chips */}
              {messages.length <= 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(qp.prompt)}
                      className="px-3 py-1.5 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
                    >
                      <span>{qp.title}</span>
                      <ChevronRight className="w-3 h-3 text-neutral-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center rounded-2xl border border-neutral-300 bg-neutral-50/60 focus-within:border-neutral-900 focus-within:bg-white focus-within:ring-1 focus-within:ring-neutral-900 transition-all p-1.5 shadow-xs"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Message your AI Learning Architect (e.g. I want to learn machine learning so create roadmap)..."
                  disabled={loading || generating}
                  className="w-full bg-transparent px-3.5 py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim() || generating}
                  className="btn-black !p-2 rounded-xl shrink-0 disabled:opacity-30 disabled:hover:bg-neutral-900"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-center text-neutral-400">
                Agent autonomously calls Fluxbase SQL tools and generates deterministic topological DAG sequences.
              </p>
            </div>
          </div>
        </div>

        {/* Right Collapsible Panel: Extracted Profile & DAG Builder */}
        {drawerOpen && (
          <div className="w-80 sm:w-96 minimal-card p-5 space-y-4 overflow-y-auto shrink-0 animate-in slide-in-from-right-4 duration-200">
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
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Target Role</span>
                  <p className="font-bold text-neutral-900 text-sm">{extractedProfile.target_goal}</p>
                  {extractedProfile.summary && (
                    <p className="text-neutral-600 text-xs leading-relaxed mt-1">{extractedProfile.summary}</p>
                  )}
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-0.5">
                    <span className="text-neutral-400 text-[10px] block uppercase">Level</span>
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
                    <span className="text-neutral-400 text-[10px] block uppercase">Duration</span>
                    <span className="font-semibold text-neutral-900">{extractedProfile.target_duration_weeks} wks</span>
                  </div>
                </div>

                {/* Extracted Baseline Skills */}
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

                {/* Build Roadmap CTA */}
                <div className="pt-2">
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={generating}
                    className="w-full btn-black !py-3 shadow-md inline-flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating DAG Roadmap...</span>
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
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  Type your goal or background in the chat. The AI will extract your profile and sync it to Fluxbase.
                </p>
              </div>
            )}

            {/* Generation Progress Indicator */}
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
        )}
      </div>
    </div>
  );
}
