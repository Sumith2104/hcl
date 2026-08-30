'use client'

import { useState } from 'react'
import { useAppStore, type AppNotification, type NotificationType } from '@/store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  Megaphone,
  Clock,
  Trophy,
  Lightbulb,
  CheckCircle2,
  CheckCheck,
  CircleCheckBig,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ==================== HELPERS ====================

function getRelativeTime(date: Date): string {
  const now = Date.now()
  const then = date.getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const iconProps = { className: 'h-4 w-4' }
  switch (type) {
    case 'system':
      return <Megaphone {...iconProps} />
    case 'reminder':
      return <Clock {...iconProps} />
    case 'achievement':
      return <Trophy {...iconProps} />
    case 'tip':
      return <Lightbulb {...iconProps} />
  }
}

function getNotificationIconBg(type: NotificationType): string {
  switch (type) {
    case 'system':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    case 'reminder':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    case 'achievement':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    case 'tip':
      return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getNotificationAccent(type: NotificationType): string {
  switch (type) {
    case 'system':
      return 'border-l-gray-800 dark:border-l-gray-300'
    case 'reminder':
      return 'border-l-gray-500 dark:border-l-gray-400'
    case 'achievement':
      return 'border-l-gray-800 dark:border-l-gray-300'
    case 'tip':
      return 'border-l-gray-400 dark:border-l-gray-500'
  }
}

// ==================== NOTIFICATION ITEM ====================

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification
  onRead: (id: string) => void
}) {
  const iconBg = getNotificationIconBg(notification.type)
  const accent = getNotificationAccent(notification.type)
  const isUnread = !notification.read

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      onClick={() => {
        if (isUnread) onRead(notification.id)
      }}
      className={
        `group relative flex items-start gap-3 rounded-md p-3 transition-colors cursor-pointer
        ${isUnread ? 'border-l-[3px] ' + accent + ' bg-gray-50/80 dark:bg-white/[0.03]' : 'border-l-[3px] border-l-transparent hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}
      `}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium leading-snug truncate ${
              isUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {notification.title}
          </p>
          {isUnread && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-800 dark:bg-gray-300" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {notification.description}
        </p>
        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          {getRelativeTime(notification.timestamp)}
        </p>
      </div>
    </motion.div>
  )
}

// ==================== EMPTY STATE ====================

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <CircleCheckBig className="h-10 w-10 text-gray-600 dark:text-gray-400" />
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 12 }}
          className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 dark:bg-gray-300 shadow-sm"
        >
          <CheckCircle2 className="h-4 w-4 text-white dark:text-gray-800" />
        </motion.div>
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-5 text-base font-semibold text-gray-900 dark:text-gray-100"
      >
        All caught up!
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 text-center max-w-[220px]"
      >
        No new notifications. Keep learning and check back later!
      </motion.p>
    </motion.div>
  )
}

// ==================== MAIN PANEL ====================

export function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const notifications = useAppStore((s) => s.notifications)
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
    toast.success('All notifications marked as read')
  }

  const handleMarkRead = (id: string) => {
    markNotificationRead(id)
  }

  // Sort: unread first, then by timestamp (newest first)
  const sorted = [...notifications].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1
    return b.timestamp.getTime() - a.timestamp.getTime()
  })

  const allRead = unreadCount === 0

  return (
    <>
      {/* Bell trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative h-8 w-8 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-white/[0.06] transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-800 dark:bg-gray-300 px-1 text-[10px] font-bold text-white dark:text-gray-800"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white dark:bg-[#1c1e26]">
          <SheetHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg text-gray-900 dark:text-gray-100">Notifications</SheetTitle>
                {!allRead && (
                  <Badge className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-300 border-0">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {!allRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-8 gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
            <SheetDescription className="sr-only">
              Your recent activity and notifications
            </SheetDescription>
          </SheetHeader>

          <Separator className="mt-2" />

          <div className="flex-1 overflow-hidden">
            {allRead ? (
              <EmptyState />
            ) : (
              <ScrollArea className="h-[calc(100vh-6rem)]">
                <div className="flex flex-col gap-1 p-3">
                  <AnimatePresence mode="popLayout">
                    {sorted.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={handleMarkRead}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
