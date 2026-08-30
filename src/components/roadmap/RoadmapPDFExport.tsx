'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Download, FileText, Printer, Eye } from 'lucide-react'
import { Loader2 } from 'lucide-react'

export function RoadmapPDFExport({ className }: { className?: string }) {
  const { user, profile } = useAppStore()
  const [open, setOpen] = useState(false)
  const [roadmap, setRoadmap] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && !roadmap) {
      loadRoadmap()
    }
  }, [open])

  const loadRoadmap = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/roadmap')
      const data = await res.json()
      if (!data.error) {
        setRoadmap(data)
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Parse roadmap into phases
  const getPhases = () => {
    if (!roadmap || !roadmap.items) return []
    const items = roadmap.items as Array<Record<string, unknown>>
    const phasesMap: Record<number, Array<Record<string, unknown>>> = {}
    for (const item of items) {
      const phase = (item.phase as number) ?? 1
      if (!phasesMap[phase]) phasesMap[phase] = []
      phasesMap[phase].push(item)
    }
    return Object.keys(phasesMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map((pNum) => ({
        phase: pNum,
        items: phasesMap[pNum],
      }))
  }

  const phases = getPhases()
  const [today, setToday] = useState('')
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }))
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <FileText className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-neutral-900" />
            Roadmap Print Preview
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
            <span className="ml-2 text-muted-foreground">Loading roadmap...</span>
          </div>
        ) : !roadmap ? (
          <div className="text-center py-12 text-muted-foreground">
            No roadmap data found. Generate a roadmap first.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button onClick={handlePrint} className="bg-neutral-900 text-white hover:bg-neutral-800">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>

            {/* Print Preview Area */}
            <div id="roadmap-print-area" className="print-area">
              {/* Title Header */}
              <div className="border-b-2 border-neutral-200 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-foreground">Study Buddies Learning Roadmap</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                  <span>Generated: {today}</span>
                  {user && <span>Learner: {user.name}</span>}
                  {user && <span>Email: {user.email}</span>}
                </div>
                {roadmap.targetGoal && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-800">
                      Goal: {roadmap.targetGoal as string}
                    </span>
                  </div>
                )}
                {roadmap.estimatedDurationWeeks && (
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground">
                      Estimated Duration: {roadmap.estimatedDurationWeeks as number} weeks
                    </span>
                  </div>
                )}
              </div>

              {/* Phases */}
              {phases.map((phase) => {
                const phaseItems = phase.items
                const firstItem = phaseItems[0]
                return (
                  <Card key={phase.phase} className="mb-6 print-card">
                    <CardContent className="pt-5">
                      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs font-bold">
                          {phase.phase}
                        </span>
                        Phase {phase.phase}: {firstItem?.title as string ?? `Learning Phase ${phase.phase}`}
                      </h2>
                      <div className="border-t border-border/50 mt-2 pt-3 space-y-3">
                        {phaseItems.map((item) => {
                          const resources = (item.resources as Array<Record<string, Record<string, string>>>) ?? []
                          return (
                            <div key={item.id as string} className="pl-4 border-l-2 border-gray-200">
                              <div className="flex items-start gap-2">
                                <h3 className="font-semibold text-sm">
                                  {item.title as string}
                                </h3>
                                {item.estimatedHours && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                                    (~{item.estimatedHours as number}h)
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.description as string}
                                </p>
                              )}
                              {item.milestone && (
                                <div className="mt-1.5">
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                                    &#127919; Milestone: {item.milestone as string}
                                  </span>
                                </div>
                              )}
                              {resources.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Resources:</p>
                                  <ul className="space-y-0.5">
                                    {resources.map((r, ri) => (
                                      <li key={ri} className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span className="text-neutral-900">&#8226;</span>
                                        {r.resource?.title ?? 'Resource'}
                                        {r.resource?.type && (
                                          <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                            {r.resource.type}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
                <p>Generated by Study Buddies &mdash; AI-Powered Personalized Learning Path Recommender</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
