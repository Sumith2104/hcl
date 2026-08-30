'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, RefreshCw, AlertCircle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface WeeklySummaryCardProps {
  className?: string
}

interface SummaryData {
  summary: string
  generatedAt: string
  highlights: string[]
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export function WeeklySummaryCard({ className = '' }: WeeklySummaryCardProps) {
  const user = useAppStore((s) => s.user)
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSummary = useCallback(async () => {
    if (!user?.id) return

    const isRefresh = data !== null
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/weekly-summary?userId=${user.id}`)
      if (!res.ok) {
        throw new Error('Failed to load summary')
      }
      const json = await res.json()
      if (json.error) {
        throw new Error(json.error)
      }
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id, data])

  useEffect(() => {
    fetchSummary()
  }, [user?.id])

  const handleRefresh = () => {
    fetchSummary()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38, duration: 0.4 }}
      className={className}
    >
      <Card className="overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gray-200 flex items-center justify-center">
                <Brain className="h-4 w-4 text-gray-600" />
              </div>
              AI Weekly Insight
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 bg-gray-100 text-gray-700 border-0">
                AI
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-foreground"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              aria-label="Refresh summary"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {(loading || refreshing) && !data && (
            <div className="space-y-3 py-2">
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-11/12" />
              <div className="skeleton-line w-4/5" />
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-3/4" />
              <div className="flex gap-2 mt-4">
                <div className="skeleton-shimmer h-6 w-24 rounded-full" />
                <div className="skeleton-shimmer h-6 w-28 rounded-full" />
                <div className="skeleton-shimmer h-6 w-20 rounded-full" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <AlertCircle className="h-5 w-5 text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 mb-3">{error}</p>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
            </div>
          )}

          {/* Loaded State */}
          {data && !error && (
            <div>
              {/* Summary Text */}
              <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line mb-4">
                {data.summary}
              </div>

              {/* Highlights */}
              {data.highlights && data.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {data.highlights.map((highlight, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs border-gray-300 text-gray-700 bg-gray-100/50 gap-1 py-0.5"
                    >
                      <Sparkles className="h-3 w-3" />
                      {highlight}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              {data.generatedAt && (
                <p className="text-[11px] text-gray-500/70 mt-2">
                  Generated {formatTimeAgo(data.generatedAt)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
