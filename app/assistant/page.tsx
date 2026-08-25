'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Cpu, 
  Clock, 
  Zap, 
  BookOpen, 
  HelpCircle, 
  Terminal, 
  Check, 
  Copy,
  ChevronDown
} from 'lucide-react';
import { BEDROCK_MODELS, DEFAULT_BEDROCK_MODEL } from '@/lib/aws/models';
import { cn, formatUSD } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { MarkdownRenderer } from '@/components/markdown-renderer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  provider?: string;
  costUsd?: number;
  latencyMs?: number;
}

export default function AssistantPage() {
  const { user } = useAuth();
  const activeUserId = user?.id || 'usr_demo_101';
  const userName = user?.name || 'Alex';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hello ${userName}! I'm your dedicated AI Learning Mentor. I have direct access to your verified learning path and active milestones on Fluxbase. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: DEFAULT_BEDROCK_MODEL,
      provider: 'aws_bedrock'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_BEDROCK_MODEL);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const loadMentorHistory = async () => {
      try {
        const res = await fetch(`/api/chat?userId=${activeUserId}`);
        const data = await res.json();
        if (data.success && data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((m: any, idx: number) => ({
            id: `msg_hist_${idx}`,
            role: m.role,
            content: m.content,
            timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            model: DEFAULT_BEDROCK_MODEL,
            provider: 'aws_bedrock'
          })));
        }
      } catch (err) {
        console.warn('Could not load mentor chat history:', err);
      }
    };

    loadMentorHistory();
  }, [activeUserId]);

  const quickPrompts = [
    'What should I study today based on my active milestone?',
    'Why is Linear Algebra a required prerequisite for Deep Learning?',
    'Explain the Scaled Dot-Product Attention mechanism simply with a code snippet',
    'Give me a 5-minute practice coding challenge on vector embeddings'
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userId: activeUserId,
          modelId: selectedModel
        })
      });

      const data = await res.json();
      if (data.reply) {
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.telemetry?.model || selectedModel,
          provider: data.telemetry?.provider || 'aws_bedrock',
          costUsd: data.telemetry?.costUsd,
          latencyMs: data.telemetry?.latencyMs
        };
        setMessages([...newMessages, assistantMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-neutral-900 text-white">
              <Bot className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              AI Learning Mentor
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Grounded 1-on-1 tutoring directly aligned with your Fluxbase roadmap & prerequisites.
          </p>
        </div>

        {/* Model Selection Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-neutral-500 font-mono hidden sm:inline">Engine:</span>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="minimal-input !py-1.5 !px-3 text-xs font-medium cursor-pointer"
          >
            {Object.values(BEDROCK_MODELS).map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="minimal-card p-4 sm:p-6 space-y-4 min-h-[500px] flex flex-col justify-between">
        {/* Messages List */}
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                }`}
              >
                {msg.role === 'user' ? 'U' : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className="space-y-1 max-w-[85%]">
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-neutral-900 text-white rounded-tr-none'
                      : 'bg-neutral-50 text-neutral-900 rounded-tl-none border border-neutral-200/80 shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>

                <div
                  className={`flex items-center gap-2 text-[10px] text-neutral-400 font-mono ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.latencyMs && <span>· {msg.latencyMs}ms</span>}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono py-2">
              <span className="w-2 h-2 rounded-full bg-neutral-900 animate-ping" />
              <span>Mentor is analyzing your roadmap context...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Suggested Questions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="text-left p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-xs text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
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
              placeholder="Ask a technical question or request a custom practice challenge..."
              disabled={loading}
              className="flex-1 minimal-input"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-black !p-2.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
