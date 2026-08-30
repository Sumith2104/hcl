'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Brain, Cpu, TrendingUp, Sparkles, Activity, Clock, Zap, Search } from 'lucide-react'
import { getEmbedding, cosineSimilarity } from '@/lib/ml/embeddings'
import { updateKnowledgeState, DEFAULT_BKT_PARAMS } from '@/lib/ml/knowledge-tracing'
import { calculateRetrievability, scheduleNextReview } from '@/lib/ml/spaced-repetition'

export function MLInsightsPanel() {
  // 1. Neural Embedding Interactive State
  const [searchQuery, setSearchQuery] = useState('Distributed high-throughput streaming systems')
  const sampleTargets = [
    'Apache Kafka Message Queues & Event Streaming',
    'Rust Concurrency and Memory Safety',
    'PostgreSQL Relational Database & Indexing',
    'Docker & Kubernetes Container Orchestration',
    'CSS Grid and Modern UI Styling'
  ]

  const scoredTargets = sampleTargets.map(target => {
    const qVec = getEmbedding(searchQuery)
    const tVec = getEmbedding(target)
    const similarity = cosineSimilarity(qVec, tVec)
    return { target, similarity: Number((similarity * 100).toFixed(1)) }
  }).sort((a, b) => b.similarity - a.similarity)

  // 2. BKT Cognitive Knowledge Tracing State
  const [bktPrior, setBktPrior] = useState(25)
  const [bktHistory, setBktHistory] = useState<number[]>([25])

  const handleBKTStep = (isCorrect: boolean) => {
    const currentProb = bktHistory[bktHistory.length - 1] / 100
    const result = updateKnowledgeState(currentProb, isCorrect, DEFAULT_BKT_PARAMS)
    setBktHistory(prev => [...prev, Number((result.nextPLt * 100).toFixed(1))])
  }

  const resetBKT = () => {
    setBktHistory([bktPrior])
  }

  // 3. FSRS Memory Retention Curve State
  const [stabilityDays, setStabilityDays] = useState(7)
  const [elapsedDay, setElapsedDay] = useState(3)
  const currentRetrievability = calculateRetrievability(elapsedDay, stabilityDays)

  return (
    <Card className="border-indigo-500/30 bg-gradient-to-br from-card/90 via-card to-indigo-950/20 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Machine Learning & AI Engine
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs">
                  Active
                </Badge>
              </CardTitle>
              <CardDescription>
                Live Bayesian Knowledge Tracing, FSRS Forgetting Curve, & Neural Vector Similarity
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="embeddings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
            <TabsTrigger value="embeddings" className="text-xs sm:text-sm flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              Neural Vectors
            </TabsTrigger>
            <TabsTrigger value="bkt" className="text-xs sm:text-sm flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              BKT Mastery
            </TabsTrigger>
            <TabsTrigger value="fsrs" className="text-xs sm:text-sm flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              FSRS Memory
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Neural Vector Embeddings */}
          <TabsContent value="embeddings" className="space-y-4 pt-3">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type any skill or goal (e.g. distributed systems)..."
                className="bg-background/80 text-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground flex justify-between">
                <span>SEMANTIC VECTOR PROJECTION (Cosine Similarity)</span>
                <span>MATCH AFFINITY</span>
              </div>
              {scoredTargets.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-2.5 text-xs transition-all hover:bg-muted/40"
                >
                  <span className="font-medium text-foreground">{item.target}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${item.similarity}%` }}
                      />
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        item.similarity >= 80
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : item.similarity >= 60
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.similarity}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 2: Bayesian Knowledge Tracing (BKT) */}
          <TabsContent value="bkt" className="space-y-4 pt-3">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Current Latent Mastery P(L_t):</span>
                <span className="text-base font-bold text-indigo-400">
                  {bktHistory[bktHistory.length - 1]}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${bktHistory[bktHistory.length - 1]}%` }}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  onClick={() => handleBKTStep(true)}
                >
                  Simulate Correct (+Mastery)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => handleBKTStep(false)}
                >
                  Simulate Slip/Error
                </Button>
                <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={resetBKT}>
                  Reset
                </Button>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground flex justify-between px-1">
              <span>P(Slip): 10%</span>
              <span>P(Guess): 25%</span>
              <span>P(Transition): 15%</span>
            </div>
          </TabsContent>

          {/* TAB 3: FSRS Memory Retrievability Model */}
          <TabsContent value="fsrs" className="space-y-4 pt-3">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Memory Stability (S):</span>
                <span className="font-bold text-indigo-400">{stabilityDays} Days</span>
              </div>
              <Slider
                value={[stabilityDays]}
                min={1}
                max={30}
                step={1}
                onValueChange={v => setStabilityDays(v[0])}
              />

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-muted-foreground">Elapsed Days (t):</span>
                <span className="font-bold text-indigo-400">{elapsedDay} Days</span>
              </div>
              <Slider
                value={[elapsedDay]}
                min={0}
                max={30}
                step={1}
                onValueChange={v => setElapsedDay(v[0])}
              />

              <div className="mt-3 flex items-center justify-between rounded-lg bg-background/60 p-2.5 border border-border/40">
                <span className="text-xs font-medium">Predicted Retrievability R(t, S):</span>
                <Badge
                  className={`text-xs ${
                    currentRetrievability >= 0.85
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : currentRetrievability >= 0.60
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {(currentRetrievability * 100).toFixed(1)}% Recall Probability
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
