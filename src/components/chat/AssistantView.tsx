'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Sparkles, User, Bot, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const quickQuestions = [
 'What should I study today?',
 'Explain my current topic simply',
 'Why is this skill recommended?',
 'Can I skip this topic?',
 'I\'m stuck, help me understand',
]

export function AssistantView() {
 const { user, chatMessages, addChatMessage, chatLoading, setChatLoading, dashboardStats, profile } = useAppStore()
 const [input, setInput] = useState('')
 const scrollRef = useRef<HTMLDivElement>(null)
 const inputRef = useRef<HTMLInputElement>(null)

 useEffect(() => {
 loadHistory()
 inputRef.current?.focus()
 }, [])

 useEffect(() => {
 requestAnimationFrame(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight
 }
 })
 }, [chatMessages, chatLoading])

 const loadHistory = async () => {
 try {
 const res = await fetch(`/api/assistant?userId=${user!.id}`)
 const data = await res.json()
 if (data.messages) {
 data.messages.forEach((m: any) => addChatMessage(m.role, m.content))
 }
 } catch { /* no history yet */ }
 }

 const handleSend = async (msg?: string) => {
 const message = msg || input.trim()
 if (!message) return

 addChatMessage('user', message)
 setInput('')
 setChatLoading(true)

 try {
 const res = await fetch('/api/chat', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 userId: user!.id,
 message,
 context: {
 userName: user!.name,
 targetGoal: profile?.targetGoal || 'Not set',
 currentPhase: `Phase ${dashboardStats.currentPhase}`,
 currentSkill: dashboardStats.currentSkill,
 overallProgress: dashboardStats.overallProgress,
 },
 }),
 })
 const data = await res.json()
 if (data.error) { toast.error(data.error); return }
 addChatMessage('assistant', data.reply)
 } catch { toast.error('Failed to get response') }
 finally { setChatLoading(false); inputRef.current?.focus() }
 }

 return (
 <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 h-[calc(100vh-4rem)] flex flex-col">
 <div className="mb-4 flex-shrink-0">
 <div className="flex items-center gap-3 mb-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 shadow-lg shadow-black/10">
 <Sparkles className="h-5 w-5 text-white" />
 </div>
 <div>
 <h1 className="text-xl font-bold">AI Learning Mentor</h1>
 <p className="text-sm text-muted-foreground">Ask anything about your learning journey</p>
 </div>
 <Badge variant="secondary" className="ml-auto text-xs bg-gray-100 text-gray-700">
 {dashboardStats.overallProgress}% on track
 </Badge>
 </div>
 </div>

 <Card className="flex-1 flex flex-col overflow-hidden bg-white/60 backdrop-blur-md border border-white/40 shadow-sm">
 <div className="flex-1 overflow-y-auto p-4 sm:p-6" ref={scrollRef} style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
 {chatMessages.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-center py-12">
 <div className="h-16 w-16 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center mb-4">
 <Lightbulb className="h-8 w-8 text-gray-500" />
 </div>
 <h3 className="text-lg font-semibold mb-2">Your AI Learning Mentor</h3>
 <p className="text-sm text-muted-foreground mb-6 max-w-sm">
 I know your roadmap and progress. Ask me about your current topic, get explanations, or figure out what to study next.
 </p>
 <div className="flex flex-wrap justify-center gap-2">
 {quickQuestions.map((q) => (
 <button
 key={q}
 onClick={() => handleSend(q)}
 className="rounded-full border border-white/40 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-xs text-gray-600 hover:bg-white/80 hover:text-gray-700 hover:border-white/60 transition-colors"
 >
 {q}
 </button>
 ))}
 </div>
 </div>
 ) : (
 <div className="space-y-4 pr-4">
 <AnimatePresence>
 {chatMessages.map((msg, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
 >
 <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
 msg.role === 'assistant'
 ? 'bg-neutral-800'
 : 'bg-gray-300'
 }`}>
 {msg.role === 'assistant' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-gray-700" />}
 </div>
 <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
 msg.role === 'assistant'
 ? 'bg-white/60 backdrop-blur-md border border-white/40 shadow-sm border-l-[3px] border-l-gray-400'
 : 'bg-neutral-800 text-white shadow-md shadow-black/10'
 }`}>
 {msg.content.split('\n').map((line, li) => (
 <p key={li} className={li > 0 ? 'mt-2' : ''}>{line}</p>
 ))}
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 {chatLoading && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800">
 <Bot className="h-4 w-4 text-white" />
 </div>
 <div className="bg-white/60 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/40 border-l-[3px] border-l-gray-400">
 <div className="flex gap-2">
 <div className="h-2 w-2 rounded-full bg-gray-300 typing-dot" />
 <div className="h-2 w-2 rounded-full bg-gray-300 typing-dot" />
 <div className="h-2 w-2 rounded-full bg-gray-300 typing-dot" />
 </div>
 </div>
 </motion.div>
 )}
 </div>
 )}
 </div>

 <div className="border-t p-4 flex gap-2 flex-shrink-0">
 <Input
 ref={inputRef}
 placeholder="Ask your AI mentor..."
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
 disabled={chatLoading}
 className="flex-1"
 />
 <Button
 onClick={() => handleSend()}
 disabled={chatLoading || !input.trim()}
 className="bg-neutral-800 hover:bg-neutral-700 text-white"
 >
 {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
 </Button>
 </div>
 </Card>
 </div>
 )
}