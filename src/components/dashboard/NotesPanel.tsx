'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogFooter,
} from '@/components/ui/dialog'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import {
 StickyNote,
 Plus,
 Pencil,
 Trash2,
 Pin,
 PinOff,
 Search,
 BookOpen,
 Tag,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ==================== TYPES ====================
interface LearningNote {
 id: string
 userId: string
 title: string
 content: string
 category: string
 tags: string
 isPinned: boolean
 createdAt: string
 updatedAt: string
}

interface NotesPanelProps {
 className?: string
}

// ==================== CONSTANTS ====================
const CATEGORIES = [
 { value: 'general', label: 'General' },
 { value: 'insight', label: 'Insight' },
 { value: 'question', label: 'Question' },
 { value: 'resource', label: 'Resource' },
 { value: 'breakthrough', label: 'Breakthrough' },
] as const

type CategoryKey = (typeof CATEGORIES)[number]['value']

const CATEGORY_STYLES: Record<CategoryKey, { bg: string; text: string; border: string }> = {
 general: {
 bg: 'bg-gray-100',
 text: 'text-gray-600',
 border: 'border-gray-200',
 },
 insight: {
 bg: 'bg-gray-100',
 text: 'text-gray-600',
 border: 'border-gray-200',
 },
 question: {
 bg: 'bg-gray-100',
 text: 'text-gray-600',
 border: 'border-gray-200',
 },
 resource: {
 bg: 'bg-gray-100',
 text: 'text-gray-700',
 border: 'border-gray-200',
 },
 breakthrough: {
 bg: 'bg-gray-100',
 text: 'text-gray-600',
 border: 'border-gray-200',
 },
}

// ==================== HELPERS ====================
function getRelativeTime(dateStr: string): string {
 const now = Date.now()
 const then = new Date(dateStr).getTime()
 const diffMs = now - then
 const diffSec = Math.floor(diffMs / 1000)
 const diffMin = Math.floor(diffSec / 60)
 const diffHr = Math.floor(diffMin / 60)
 const diffDay = Math.floor(diffHr / 24)
 const diffWeek = Math.floor(diffDay / 7)

 if (diffSec < 60) return 'just now'
 if (diffMin < 60) return `${diffMin}m ago`
 if (diffHr < 24) return `${diffHr}h ago`
 if (diffDay < 7) return `${diffDay}d ago`
 if (diffWeek < 4) return `${diffWeek}w ago`
 return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function parseTags(tagsStr: string): string[] {
 if (!tagsStr || !tagsStr.trim()) return []
 return tagsStr
 .split(',')
 .map((t) => t.trim())
 .filter(Boolean)
}

// ==================== ANIMATION VARIANTS ====================
const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: { staggerChildren: 0.05 },
 },
}

const cardVariants = {
 hidden: { opacity: 0, y: 12, scale: 0.97 },
 visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
 exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
}

const modalContentVariants = {
 hidden: { opacity: 0, y: 20, scale: 0.95 },
 visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } },
 exit: { opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.15 } },
}

// ==================== NOTE FORM DIALOG ====================
function NoteFormContent({
 editingNote,
 onSave,
 onCancel,
}: {
 editingNote: LearningNote | null
 onSave: (data: { title: string; content: string; category: string; tags: string }) => void
 onCancel: () => void
}) {
 const isEditing = !!editingNote
 const [title, setTitle] = useState(editingNote?.title ?? '')
 const [content, setContent] = useState(editingNote?.content ?? '')
 const [category, setCategory] = useState(editingNote?.category ?? 'general')
 const [tagsInput, setTagsInput] = useState(editingNote?.tags ?? '')

 const handleSave = () => {
 if (!title.trim()) {
 toast.error('Please enter a title')
 return
 }
 if (!content.trim()) {
 toast.error('Please enter some content')
 return
 }
 onSave({ title: title.trim(), content: content.trim(), category, tags: tagsInput.trim() })
 }

 const tagList = parseTags(tagsInput)

 return (
 <>
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <StickyNote className="h-5 w-5 text-gray-600" />
 {isEditing ? 'Edit Note' : 'New Note'}
 </DialogTitle>
 <DialogDescription>
 {isEditing ? 'Update your learning note below.' : 'Capture a new learning thought, insight, or question.'}
 </DialogDescription>
 </DialogHeader>

 <motion.div
 className="space-y-4"
 variants={modalContentVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 key={editingNote?.id ?? 'new'}
 >
 {/* Title */}
 <div className="space-y-2">
 <Label htmlFor="note-title">Title</Label>
 <Input
 id="note-title"
 placeholder="What did you learn?"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && e.metaKey) handleSave()
 }}
 />
 </div>

 {/* Content */}
 <div className="space-y-2">
 <Label htmlFor="note-content">Content</Label>
 <Textarea
 id="note-content"
 placeholder="Write your note here..."
 className="min-h-[100px]"
 rows={4}
 value={content}
 onChange={(e) => setContent(e.target.value)}
 />
 </div>

 {/* Category */}
 <div className="space-y-2">
 <Label>Category</Label>
 <Select value={category} onValueChange={setCategory}>
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Select a category" />
 </SelectTrigger>
 <SelectContent>
 {CATEGORIES.map((cat) => (
 <SelectItem key={cat.value} value={cat.value}>
 {cat.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Tags */}
 <div className="space-y-2">
 <Label htmlFor="note-tags" className="flex items-center gap-1.5">
 <Tag className="h-3.5 w-3.5" />
 Tags
 </Label>
 <Input
 id="note-tags"
 placeholder="Comma-separated, e.g. react, hooks, state"
 value={tagsInput}
 onChange={(e) => setTagsInput(e.target.value)}
 />
 {tagList.length > 0 && (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {tagList.map((tag, i) => (
 <Badge
 key={`${tag}-${i}`}
 variant="outline"
 className="text-xs bg-gray-100 text-gray-600 border-gray-200"
 >
 {tag}
 </Badge>
 ))}
 </div>
 )}
 </div>
 </motion.div>

 <DialogFooter>
 <Button variant="outline" onClick={onCancel}>
 Cancel
 </Button>
 <Button onClick={handleSave}>
 {isEditing ? 'Save Changes' : 'Create Note'}
 </Button>
 </DialogFooter>
 </>
 )
}

function NoteFormDialog({
 open,
 onOpenChange,
 editingNote,
 onSave,
}: {
 open: boolean
 onOpenChange: (open: boolean) => void
 editingNote: LearningNote | null
 onSave: (data: { title: string; content: string; category: string; tags: string }) => void
}) {
 const key = editingNote?.id ?? `new-${open}`
 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-lg">
 <NoteFormContent
 key={key}
 editingNote={editingNote}
 onSave={(data) => {
 onSave(data)
 onOpenChange(false)
 }}
 onCancel={() => onOpenChange(false)}
 />
 </DialogContent>
 </Dialog>
 )
}

// ==================== NOTE VIEW DIALOG ====================
function NoteViewDialog({
 note,
 open,
 onOpenChange,
 onEdit,
}: {
 note: LearningNote | null
 open: boolean
 onOpenChange: (open: boolean) => void
 onEdit: () => void
}) {
 if (!note) return null

 const categoryStyle = CATEGORY_STYLES[note.category as CategoryKey] ?? CATEGORY_STYLES.general
 const categoryLabel = CATEGORIES.find((c) => c.value === note.category)?.label ?? note.category
 const tags = parseTags(note.tags)

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-lg">
 <DialogHeader>
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <DialogTitle className="text-lg leading-snug">{note.title}</DialogTitle>
 <div className="flex items-center gap-2 mt-2 flex-wrap">
 <Badge
 variant="outline"
 className="text-xs font-medium bg-gray-100 text-gray-600 border-gray-200"
 >
 {categoryLabel}
 </Badge>
 {note.isPinned && (
 <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
 <Pin className="h-3 w-3 mr-1" />
 Pinned
 </Badge>
 )}
 </div>
 </div>
 <Button variant="outline" size="sm" className="shrink-0" onClick={onEdit}>
 <Pencil className="h-3.5 w-3.5 mr-1.5" />
 Edit
 </Button>
 </div>
 </DialogHeader>

 <motion.div
 className="space-y-4"
 variants={modalContentVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 key={note.id}
 >
 {/* Content */}
 <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
 {note.content}
 </div>

 {/* Tags */}
 {tags.length > 0 && (
 <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
 {tags.map((tag, i) => (
 <Badge key={`${tag}-${i}`} variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
 <Tag className="h-2.5 w-2.5 mr-1" />
 {tag}
 </Badge>
 ))}
 </div>
 )}

 {/* Timestamp */}
 <p className="text-xs text-gray-500 pt-2 border-t border-border/40">
 Updated {getRelativeTime(note.updatedAt)}
 </p>
 </motion.div>
 </DialogContent>
 </Dialog>
 )
}

// ==================== EMPTY STATE ====================
function EmptyState({ onCreateNote }: { onCreateNote: () => void }) {
 return (
 <motion.div
 className="flex flex-col items-center justify-center py-10 px-4 text-center"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4 }}
 >
 {/* Notebook SVG Illustration */}
 <svg
 className="h-20 w-20 text-muted-foreground/30 mb-4"
 viewBox="0 0 64 64"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 >
 <rect x="14" y="6" width="36" height="52" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
 <rect x="18" y="10" width="28" height="44" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.03" />
 <line x1="22" y1="18" x2="42" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
 <line x1="22" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
 <line x1="22" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
 <line x1="22" y1="36" x2="34" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
 <circle cx="10" cy="12" r="2.5" fill="currentColor" fillOpacity="0.4" />
 <circle cx="10" cy="22" r="2.5" fill="currentColor" fillOpacity="0.4" />
 <circle cx="10" cy="32" r="2.5" fill="currentColor" fillOpacity="0.4" />
 <circle cx="10" cy="42" r="2.5" fill="currentColor" fillOpacity="0.4" />
 <path d="M44 58 L52 58 L52 14 L44 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
 </svg>

 <h3 className="text-sm font-semibold text-foreground mb-1">Start your learning journal</h3>
 <p className="text-xs text-gray-500 mb-4 max-w-[220px]">
 Capture insights, questions, and breakthroughs as you learn.
 </p>
 <Button size="sm" onClick={onCreateNote} className="gap-1.5">
 <Plus className="h-3.5 w-3.5" />
 Create Your First Note
 </Button>
 </motion.div>
 )
}

// ==================== NOTE CARD ====================
function NoteCard({
 note,
 onPin,
 onEdit,
 onDelete,
 onClick,
}: {
 note: LearningNote
 onPin: () => void
 onEdit: () => void
 onDelete: () => void
 onClick: () => void
}) {
 const categoryStyle = CATEGORY_STYLES[note.category as CategoryKey] ?? CATEGORY_STYLES.general
 const categoryLabel = CATEGORIES.find((c) => c.value === note.category)?.label ?? note.category
 const tags = parseTags(note.tags)

 return (
 <motion.div variants={cardVariants} layout>
 <Card
 className="group cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200/50 bg-white/60 backdrop-blur-sm"
 onClick={onClick}
 >
 <CardContent className="p-3.5">
 {/* Top row: Pin + Category */}
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2 min-w-0">
 {note.isPinned && (
 <Pin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
 )}
 <Badge
 variant="outline"
 className={`text-[10px] font-medium shrink-0 bg-gray-100 text-gray-600 border-gray-200`}
 >
 {categoryLabel}
 </Badge>
 </div>
 <span className="text-[10px] text-gray-500 shrink-0 ml-2">
 {getRelativeTime(note.updatedAt)}
 </span>
 </div>

 {/* Title */}
 <h4 className="text-sm font-semibold text-foreground leading-snug mb-1 line-clamp-1">
 {note.title}
 </h4>

 {/* Content preview */}
 <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2.5">
 {note.content}
 </p>

 {/* Tags + Actions */}
 <div className="flex items-center justify-between gap-2">
 <div className="flex flex-wrap gap-1 min-w-0 flex-1">
 {tags.slice(0, 3).map((tag, i) => (
 <span
 key={`${tag}-${i}`}
 className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600"
 >
 {tag}
 </span>
 ))}
 {tags.length > 3 && (
 <span className="text-[10px] text-gray-500">
 +{tags.length - 3}
 </span>
 )}
 </div>

 <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
 <Button
 variant="ghost"
 size="sm"
 className="h-7 w-7 p-0"
 onClick={(e) => {
 e.stopPropagation()
 onPin()
 }}
 aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
 >
 {note.isPinned ? (
 <PinOff className="h-3.5 w-3.5 text-gray-400" />
 ) : (
 <Pin className="h-3.5 w-3.5 text-gray-400" />
 )}
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="h-7 w-7 p-0"
 onClick={(e) => {
 e.stopPropagation()
 onEdit()
 }}
 aria-label="Edit note"
 >
 <Pencil className="h-3.5 w-3.5 text-gray-400" />
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="h-7 w-7 p-0 hover:text-gray-500"
 onClick={(e) => {
 e.stopPropagation()
 onDelete()
 }}
 aria-label="Delete note"
 >
 <Trash2 className="h-3.5 w-3.5" />
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )
}

// ==================== NOTES PANEL ====================
export function NotesPanel({ className }: NotesPanelProps) {
 const { user } = useAppStore()
 const [notes, setNotes] = useState<LearningNote[]>([])
 const [searchQuery, setSearchQuery] = useState('')
 const [loading, setLoading] = useState(true)

 // Dialog states
 const [formDialogOpen, setFormDialogOpen] = useState(false)
 const [viewDialogOpen, setViewDialogOpen] = useState(false)
 const [editingNote, setEditingNote] = useState<LearningNote | null>(null)
 const [viewingNote, setViewingNote] = useState<LearningNote | null>(null)
 const [deletingId, setDeletingId] = useState<string | null>(null)

 const fetchNotes = useCallback(async () => {
 if (!user?.id) return
 try {
 setLoading(true)
 const res = await fetch(`/api/notes?userId=${user.id}`)
 const data = await res.json()
 if (data.notes) {
 setNotes(data.notes)
 }
 } catch {
 toast.error('Failed to load notes')
 } finally {
 setLoading(false)
 }
 }, [user?.id])

 useEffect(() => {
 fetchNotes()
 }, [fetchNotes])

 // Filter notes by search query
 const filteredNotes = notes.filter((note) => {
 if (!searchQuery.trim()) return true
 const q = searchQuery.toLowerCase()
 return (
 (note.title || '').toLowerCase().includes(q) ||
 (note.content || '').toLowerCase().includes(q) ||
 (note.tags || '').toLowerCase().includes(q)
 )
 })

 // Handlers
 const handleCreateNote = () => {
 setEditingNote(null)
 setFormDialogOpen(true)
 }

 const handleEditNote = (note: LearningNote) => {
 setEditingNote(note)
 setFormDialogOpen(true)
 setViewDialogOpen(false)
 }

 const handleViewNote = (note: LearningNote) => {
 setViewingNote(note)
 setViewDialogOpen(true)
 }

 const handleSaveNote = async (data: { title: string; content: string; category: string; tags: string }) => {
 if (!user?.id) return
 try {
 const body: Record<string, unknown> = {
 userId: user.id,
 ...data,
 }
 if (editingNote) {
 body.noteId = editingNote.id
 }
 const res = await fetch('/api/notes', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 })
 const result = await res.json()
 if (result.error) {
 toast.error(result.error)
 return
 }
 toast.success(editingNote ? 'Note updated' : 'Note created')
 fetchNotes()
 } catch {
 toast.error('Failed to save note')
 }
 }

 const handleTogglePin = async (note: LearningNote) => {
 if (!user?.id) return
 try {
 const action = note.isPinned ? 'unpin' : 'pin'
 const res = await fetch('/api/notes', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: user.id, noteId: note.id, action }),
 })
 if (res.ok) {
 toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned')
 fetchNotes()
 }
 } catch {
 toast.error('Failed to update pin')
 }
 }

 const handleDeleteNote = async (note: LearningNote) => {
 if (!user?.id) return
 setDeletingId(note.id)
 try {
 const res = await fetch('/api/notes', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: user.id, noteId: note.id, action: 'delete' }),
 })
 if (res.ok) {
 toast.success('Note deleted')
 // Animate out then remove
 setTimeout(() => {
 setNotes((prev) => prev.filter((n) => n.id !== note.id))
 setDeletingId(null)
 }, 200)
 }
 } catch {
 toast.error('Failed to delete note')
 setDeletingId(null)
 }
 }

 return (
 <>
 <Card className={className}>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
 <StickyNote className="h-4 w-4 text-gray-600" />
 </div>
 <div>
 <CardTitle className="text-base font-semibold">Learning Journal</CardTitle>
 <p className="text-xs text-gray-500 mt-0.5">
 {notes.length} {notes.length === 1 ? 'note' : 'notes'}
 </p>
 </div>
 </div>
 <Button size="sm" onClick={handleCreateNote} className="gap-1.5">
 <Plus className="h-3.5 w-3.5" />
 <span className="hidden sm:inline">New Note</span>
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {/* Search Input */}
 {notes.length > 0 && (
 <div className="relative mb-3">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
 <Input
 placeholder="Search notes..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-8 h-8 text-sm"
 />
 </div>
 )}

 {/* Loading State */}
 {loading && (
 <div className="flex items-center justify-center py-8">
 <div className="h-6 w-6 border-2 border-gray-300/30 border-t-gray-500 rounded-full animate-spin" />
 </div>
 )}

 {/* Empty State */}
 {!loading && notes.length === 0 && (
 <EmptyState onCreateNote={handleCreateNote} />
 )}

 {/* Notes List */}
 {!loading && notes.length > 0 && (
 <ScrollArea className="max-h-80">
 {filteredNotes.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <Search className="h-8 w-8 text-gray-300 mb-2" />
 <p className="text-sm text-gray-500">No notes match your search</p>
 </div>
 ) : (
 <motion.div
 className="space-y-2.5 pr-2"
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 >
 <AnimatePresence mode="popLayout">
 {filteredNotes.map((note) => (
 <NoteCard
 key={note.id}
 note={note}
 onPin={() => handleTogglePin(note)}
 onEdit={() => handleEditNote(note)}
 onDelete={() => handleDeleteNote(note)}
 onClick={() => handleViewNote(note)}
 />
 ))}
 </AnimatePresence>
 </motion.div>
 )}
 </ScrollArea>
 )}
 </CardContent>
 </Card>

 {/* Note Form Dialog (Create/Edit) */}
 <NoteFormDialog
 open={formDialogOpen}
 onOpenChange={setFormDialogOpen}
 editingNote={editingNote}
 onSave={handleSaveNote}
 />

 {/* Note View Dialog */}
 <NoteViewDialog
 note={viewingNote}
 open={viewDialogOpen}
 onOpenChange={setViewDialogOpen}
 onEdit={() => {
 if (viewingNote) handleEditNote(viewingNote)
 }}
 />
 </>
 )
}
