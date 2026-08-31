// ==================== ML ENGINE ====================
// Replaces all rule-based/deterministic logic with AI/ML-powered alternatives.
// Uses LLM (via z-ai-web-dev-sdk) as the core ML backbone for:
//   - Semantic similarity / embedding-based matching
//   - Intelligent classification and prediction
//   - Personalized recommendations and interventions
//   - Adaptive difficulty and progression

import { llmChat } from './ai-engine'

function parseJSON<T>(text: string): T | null {
  try {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as T
  } catch { /* parse failure */ }
  return null
}

// ==================== ML CACHES ====================

const adaptationCache = new Map<string, { result: MLAdaptationResult; timestamp: number }>()
const ADAPTATION_CACHE_TTL = 5 * 60 * 1000 // 5 min

const resourceMatchCache = new Map<string, { result: MLResourceMatch[]; timestamp: number }>()
const RESOURCE_MATCH_CACHE_TTL = 60 * 60 * 1000 // 1 hour

const domainCache = new Map<string, { result: string; timestamp: number }>()
const DOMAIN_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

const tipCache = new Map<string, { result: MLTip; timestamp: number }>()
const TIP_CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

const courseMetaCache = new Map<string, { result: MLCourseMeta; timestamp: number }>()
const COURSE_META_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// ==================== 1. ML-POWERED LEARNER STATE CLASSIFICATION ====================
// Replaces: evaluateAdaptation() hardcoded thresholds

export interface MLAdaptationResult {
  state: 'struggling' | 'on_track' | 'excelling'
  confidence: number // 0-1 how confident the ML model is
  riskFactors: string[] // e.g. ["high time investment", "low assessment score"]
  strengths: string[] // e.g. ["fast completion", "strong feedback sentiment"]
  predictedCompletionWeeks: number // ML-predicted weeks to finish current skill
  dropoffRisk: number // 0-1 probability of abandoning this skill
}

export async function mlEvaluateAdaptation(
  params: {
    completionPercentage: number
    assessmentScore: number | null
    feedback: string
    timeSpentHours: number
    estimatedHours: number
    skillName: string
    learnerExperience: string // beginner/intermediate/advanced
    historicalAvgScore?: number
    daysSinceStart?: number
  }
): Promise<MLAdaptationResult> {
  const cacheKey = `${params.skillName}:${params.completionPercentage}:${params.assessmentScore}:${Math.floor(params.timeSpentHours)}`
  const cached = adaptationCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < ADAPTATION_CACHE_TTL) return cached.result

  const prompt = `Analyze this learner's progress on "${params.skillName}" and classify their state.

Data:
- Completion: ${params.completionPercentage}%
- Assessment score: ${params.assessmentScore ?? 'not taken'}
- Time spent: ${params.timeSpentHours}h (estimated: ${params.estimatedHours}h)
- Learner experience: ${params.learnerExperience}
- Feedback: "${params.feedback || 'none'}"
- Historical avg score: ${params.historicalAvgScore ?? 'N/A'}
- Days since start: ${params.daysSinceStart ?? 'N/A'}

Respond with ONLY this JSON:
{"state":"struggling"|"on_track"|"excelling","confidence":0.0-1.0,"riskFactors":["..."],"strengths":["..."],"predictedCompletionWeeks":0,"dropoffRisk":0.0-1.0}

Be generous with "on_track". Only classify as struggling if there are clear signals. Consider learning velocity and sentiment, not just numbers.`

  try {
    const response = await llmChat(
      'You are an ML-based learning analytics engine. Analyze learner behavior signals to predict outcomes and classify learning state. Return only valid JSON.',
      prompt
    )
    const parsed = parseJSON<MLAdaptationResult>(response)
    if (parsed && ['struggling', 'on_track', 'excelling'].includes(parsed.state)) {
      const result: MLAdaptationResult = {
        state: parsed.state,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        predictedCompletionWeeks: Math.max(1, parsed.predictedCompletionWeeks || 2),
        dropoffRisk: Math.min(1, Math.max(0, parsed.dropoffRisk || 0)),
      }
      adaptationCache.set(cacheKey, { result, timestamp: Date.now() })
      return result
    }
  } catch (e) {
    console.error('[ML] Adaptation evaluation failed:', e)
  }

  // Intelligent fallback with softer thresholds than the old rule-based system
  const timeRatio = params.estimatedHours > 0 ? params.timeSpentHours / params.estimatedHours : 1
  const score = params.assessmentScore
  let state: MLAdaptationResult['state'] = 'on_track'
  const riskFactors: string[] = []
  const strengths: string[] = []

  if (timeRatio > 2.0) riskFactors.push('significantly over time budget')
  else if (timeRatio > 1.5) riskFactors.push('slightly over time budget')
  if (timeRatio < 0.5) strengths.push('completing well ahead of schedule')

  if (score !== null) {
    if (score < 40) { state = 'struggling'; riskFactors.push(`low assessment score (${score}%)`) }
    else if (score < 55 && timeRatio > 1.3) { state = 'struggling'; riskFactors.push('combined low score and slow pace') }
    else if (score > 90 && timeRatio < 0.7) { state = 'excelling'; strengths.push(`high score (${score}%) with fast pace`) }
    else if (score > 85) { state = 'excelling'; strengths.push(`strong assessment score (${score}%)`) }
  }

  if (params.completionPercentage < 20 && timeRatio > 1.5) {
    state = 'struggling'
    riskFactors.push('very low completion despite significant time')
  }
  if (params.completionPercentage > 70 && timeRatio < 0.6) {
    state = 'excelling'
    strengths.push('high completion rate at fast pace')
  }

  // Sentiment analysis on feedback
  const negWords = ['difficult', 'hard', 'struggling', 'confused', 'lost', 'overwhelmed', 'frustrated', 'stuck']
  const posWords = ['easy', 'fun', 'enjoying', 'great', 'love', 'interesting', 'clear', 'clicked', 'understand']
  const fb = params.feedback.toLowerCase()
  const negCount = negWords.filter(w => fb.includes(w)).length
  const posCount = posWords.filter(w => fb.includes(w)).length
  if (negCount > posCount + 1) { riskFactors.push('negative sentiment in feedback'); if (state === 'on_track') state = 'struggling' }
  if (posCount > negCount + 1) { strengths.push('positive sentiment in feedback'); if (state === 'on_track' && score !== null && score > 75) state = 'excelling' }

  const dropoffRisk = state === 'struggling' ? Math.min(0.8, 0.3 + riskFactors.length * 0.15) : state === 'excelling' ? 0.05 : 0.15
  const result: MLAdaptationResult = {
    state,
    confidence: 0.6,
    riskFactors,
    strengths,
    predictedCompletionWeeks: Math.max(1, Math.round((params.estimatedHours - params.timeSpentHours) / (params.timeSpentHours / Math.max(1, params.daysSinceStart || 7)) * 7 / 168 * 7)),
    dropoffRisk,
  }
  adaptationCache.set(cacheKey, { result, timestamp: Date.now() })
  return result
}

// ==================== 2. ML-POWERED SEMANTIC RESOURCE MATCHING ====================
// Replaces: matchResources() keyword substring matching

export interface MLResourceMatch {
  title: string
  url: string
  type: string
  description: string
  estimatedHours: number
  relevanceScore: number // 0-1 semantic relevance
  matchReason: string // ML-explained why this resource matches
}

export async function mlMatchResources(
  skillName: string,
  skillTopics: string[],
  candidateResources: { title: string; url: string; type: string; description: string; estimatedHours: number; keywords?: string[] }[],
  maxResources: number = 3
): Promise<MLResourceMatch[]> {
  const cacheKey = `${skillName}:${skillTopics.join(',')}:${maxResources}`
  const cached = resourceMatchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < RESOURCE_MATCH_CACHE_TTL) return cached.result

  // Build a compact resource list for the LLM
  const resourceList = candidateResources.slice(0, 30).map((r, i) =>
    `${i}. [${r.type}] ${r.title} - ${r.description.substring(0, 120)} (keywords: ${(r.keywords || []).slice(0, 5).join(', ')})`
  ).join('\n')

  const prompt = `Skill: "${skillName}"
Key topics: ${skillTopics.join(', ')}

Candidate resources:
${resourceList}

Select the ${maxResources} most relevant resources for learning this skill. Consider semantic relevance, not just keyword overlap.

Respond with ONLY this JSON array:
[{"index":0,"relevanceScore":0.0-1.0,"matchReason":"brief reason"}]


Return at most ${maxResources} entries. If fewer than ${maxResources} are relevant, return only the relevant ones.`

  try {
    const response = await llmChat(
      'You are an ML-powered learning resource recommendation engine. Score resources by semantic relevance to the target skill and topics. Return only valid JSON.',
      prompt
    )
    const arrMatch = response.match(/\[[\s\S]*\]/)
    if (arrMatch) {
      const parsed = JSON.parse(arrMatch[0]) as Array<{ index: number; relevanceScore: number; matchReason: string }>
      const results: MLResourceMatch[] = []
      for (const item of parsed) {
        const r = candidateResources[item.index]
        if (!r) continue
        results.push({
          title: r.title,
          url: r.url,
          type: r.type,
          description: r.description,
          estimatedHours: r.estimatedHours,
          relevanceScore: Math.min(1, Math.max(0, item.relevanceScore || 0.5)),
          matchReason: item.matchReason || 'Semantically relevant to the skill',
        })
        if (results.length >= maxResources) break
      }
      if (results.length > 0) {
        resourceMatchCache.set(cacheKey, { result: results, timestamp: Date.now() })
        return results
      }
    }
  } catch (e) {
    console.error('[ML] Resource matching failed, using fallback:', e)
  }

  // Intelligent fallback: simple TF-IDF-like scoring
  const searchTerms = [skillName.toLowerCase(), ...skillTopics.map(t => t.toLowerCase())]
  const scored = candidateResources.map(resource => {
    const searchText = `${resource.title} ${resource.description} ${(resource.keywords || []).join(' ')}`.toLowerCase()
    let score = 0
    for (const term of searchTerms) {
      const words = term.split(/\s+/)
      for (const word of words) {
        if (word.length < 3) continue
        if (searchText.includes(word)) score += word.length > 5 ? 2 : 1
      }
    }
    // Normalize
    return { resource, score: Math.min(1, score / (searchTerms.length * 3)) }
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score)

  const results: MLResourceMatch[] = scored.slice(0, maxResources).map(s => ({
    title: s.resource.title,
    url: s.resource.url,
    type: s.resource.type,
    description: s.resource.description,
    estimatedHours: s.resource.estimatedHours,
    relevanceScore: s.score,
    matchReason: 'Matched based on topic relevance analysis',
  }))

  if (results.length > 0) {
    resourceMatchCache.set(cacheKey, { result: results, timestamp: Date.now() })
  }
  return results
}

// ==================== 3. ML-POWERED DOMAIN CLASSIFICATION ====================
// Replaces: detectDomain() regex patterns

export async function mlDetectDomain(goal: string): Promise<string> {
  const g = goal.toLowerCase().trim()
  if (/forward.?deploy|fde|solution.?architect|integration.?engineer/i.test(g)) return 'fde'
  if (/rag|generative.?ai|llm|retrieval.?augmented|langchain|agentic/i.test(g)) return 'genai-rag'
  if (/system.?engineer|rust|golang|concurrency|low.?latency/i.test(g)) return 'systems'

  const cached = domainCache.get(g)
  if (cached && Date.now() - cached.timestamp < DOMAIN_CACHE_TTL) return cached.result

  try {
    const response = await llmChat(
      'You are a text classifier. Given a career or learning goal, classify it into exactly ONE of these domains: fde, genai-rag, systems, ml, data-science, web-dev, mobile, devops, cybersecurity, game-dev, ui-ux. Respond with ONLY the domain name, nothing else.',
      goal
    )
    const domain = response.trim().toLowerCase()
    const validDomains = ['fde', 'genai-rag', 'systems', 'ml', 'data-science', 'web-dev', 'mobile', 'devops', 'cybersecurity', 'game-dev', 'ui-ux']
    const result = validDomains.includes(domain) ? domain : 'fde'
    domainCache.set(g, { result, timestamp: Date.now() })
    return result
  } catch {
    return 'fde'
  }
}

// ==================== 4. ML-POWERED SKILL GAP ANALYSIS ====================
// Replaces: findSkillGaps() ordinal comparison

export interface MLSkillGap {
  skill: string
  requiredLevel: string
  currentLevel: string
  gapSeverity: 'critical' | 'significant' | 'moderate' | 'minor'
  transferableSkills: string[] // existing skills that partially transfer
  estimatedWeeksToBridge: number
  learningPath: string[] // ordered sub-topics to study
  priority: number // 1-10 computed priority
}

export async function mlAnalyzeSkillGaps(
  userSkills: { name: string; level: string }[],
  targetSkills: { name: string; requiredLevel: string; importance: string }[],
  goal: string
): Promise<{ gaps: MLSkillGap[]; strengths: string[]; marketInsight: string }> {
  const userSkillsStr = userSkills.map(s => `${s.name} (${s.level})`).join(', ')
  const targetSkillsStr = targetSkills.map(s => `${s.name} - ${s.requiredLevel} (${s.importance})`).join(', ')

  const prompt = `You are an ML-powered career skills analyst. Analyze the gap between a learner's current skills and their target role.

Goal: ${goal}
Current skills: ${userSkillsStr || 'None'}
Required skills: ${targetSkillsStr}

Perform a comprehensive skill gap analysis considering:
1. Direct skill gaps (missing entirely or below required level)
2. Transferable skills (existing skills that partially cover requirements)
3. Learning velocity estimation based on skill relationships
4. Priority ordering based on dependency chains and market demand

Respond with ONLY this JSON:
{"gaps":[{"skill":"name","requiredLevel":"level","currentLevel":"level or none","gapSeverity":"critical|significant|moderate|minor","transferableSkills":["skill1"],"estimatedWeeksToBridge":0,"learningPath":["topic1","topic2"],"priority":1-10}],"strengths":["strength1","strength2"],"marketInsight":"brief market context"}\n

List ALL required skills that have gaps. Be specific with learning paths.`

  try {
    const response = await llmChat(
      'You are an ML-powered skill gap analyzer that considers skill transferability, learning velocity, and market demand. Return only valid JSON.',
      prompt
    )
    const parsed = parseJSON<{ gaps: MLSkillGap[]; strengths: string[]; marketInsight: string }>(response)
    if (parsed && Array.isArray(parsed.gaps)) {
      return {
        gaps: parsed.gaps.map(g => ({
          ...g,
          gapSeverity: ['critical', 'significant', 'moderate', 'minor'].includes(g.gapSeverity) ? g.gapSeverity : 'moderate',
          estimatedWeeksToBridge: Math.max(1, g.estimatedWeeksToBridge || 4),
          priority: Math.min(10, Math.max(1, g.priority || 5)),
        })),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        marketInsight: parsed.marketInsight || '',
      }
    }
  } catch (e) {
    console.error('[ML] Skill gap analysis failed:', e)
  }

  // Deterministic fallback
  const levelOrder: Record<string, number> = { none: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
  const gaps: MLSkillGap[] = targetSkills.map(ts => {
    const userSkill = userSkills.find(us => us.name.toLowerCase() === ts.name.toLowerCase())
    const userLevel = userSkill?.level || 'none'
    const userNum = levelOrder[userLevel] || 0
    const reqNum = levelOrder[ts.requiredLevel] || 1
    if (userNum >= reqNum) return null as any
    const diff = reqNum - userNum
    return {
      skill: ts.name,
      requiredLevel: ts.requiredLevel,
      currentLevel: userLevel,
      gapSeverity: diff >= 3 ? 'critical' : diff >= 2 ? 'significant' : 'moderate',
      transferableSkills: userSkills.filter(us => us.name.toLowerCase() !== ts.name.toLowerCase()).slice(0, 2).map(s => s.name),
      estimatedWeeksToBridge: diff * 3,
      learningPath: [ts.name],
      priority: ts.importance === 'critical' ? 9 : ts.importance === 'high' ? 7 : 5,
    }
  }).filter(Boolean).sort((a, b) => b.priority - a.priority)

  return { gaps, strengths: [], marketInsight: '' }
}

// ==================== 5. ML-POWERED RESOURCE RECOMMENDATION ====================
// Replaces: recommendResources() fixed weighted formula

export interface MLResourceRecommendation {
  resource: { id: string; title: string; description: string; url: string; type: string; difficulty: string; estimatedHours: number }
  score: number
  reason: string
  learningOutcome: string // what the learner will achieve
}

export async function mlRecommendResources(
  skillName: string,
  userLevel: string,
  preferredStyle: string,
  allResources: any[],
  goal: string = ''
): Promise<MLResourceRecommendation[]> {
  const relevantResources = allResources.filter((r: any) => {
    const resourceSkills: any[] = r.skills || []
    return resourceSkills.some((rs: any) => {
      const rsName = rs?.skill?.name || rs?.name || ''
      const rsLower = rsName.toLowerCase()
      const targetLower = skillName.toLowerCase()
      return rsLower === targetLower || rsLower.includes(targetLower) || targetLower.includes(rsLower)
    })
  })

  if (relevantResources.length === 0) return []

  const resourceList = relevantResources.slice(0, 15).map((r, i) =>
    `${i}. [${r.type}/${r.difficulty}] ${r.title} - ${(r.description || '').substring(0, 100)}`
  ).join('\n')

  const prompt = `A learner at ${userLevel} level who prefers ${preferredStyle} learning needs resources for "${skillName}"${goal ? ` (goal: ${goal})` : ''}.

Available resources:
${resourceList}

Rank the top 5 resources considering:
1. Difficulty alignment with learner level
2. Learning style preference match
3. Practical outcomes and project-based content
4. Progression from current level

Respond with ONLY this JSON array:
[{"index":0,"score":0.0-1.0,"reason":"why this resource","learningOutcome":"what they will achieve"}]


Return at most 5 entries ranked by score descending.`

  try {
    const response = await llmChat(
      'You are an ML-powered learning resource recommender. Consider difficulty, learning style, and practical outcomes. Return only valid JSON.',
      prompt
    )
    const arrMatch = response.match(/\[[\s\S]*\]/)
    if (arrMatch) {
      const parsed = JSON.parse(arrMatch[0]) as Array<{ index: number; score: number; reason: string; learningOutcome: string }>
      return parsed.map(item => {
        const r = relevantResources[item.index]
        if (!r) return null
        return {
          resource: { id: r.id, title: r.title, description: r.description, url: r.url, type: r.type, difficulty: r.difficulty, estimatedHours: r.estimatedHours },
          score: Math.min(1, Math.max(0, item.score || 0.5)),
          reason: item.reason || 'Recommended for your learning path',
          learningOutcome: item.learningOutcome || `Master ${skillName}`,
        }
      }).filter(Boolean) as MLResourceRecommendation[]
    }
  } catch (e) {
    console.error('[ML] Resource recommendation failed:', e)
  }

  return []
}

// ==================== 6. ML-POWERED ADAPTIVE INTERVENTION ====================
// Replaces: hardcoded struggling→add beginner resources, excelling→unlock next

export interface MLIntervention {
  type: 'add_resources' | 'unlock_ahead' | 'suggest_break' | 'change_modality' | 'pair_study' | 'micro_goals' | 'challenge_project' | 'celebrate'
  message: string
  actionDetails: string
  resources?: { title: string; url: string; reason: string }[]
  unlockItemIds?: string[]
}

export async function mlGetAdaptiveIntervention(
  params: {
    adaptationResult: MLAdaptationResult
    skillName: string
    skillDescription: string
    learnerExperience: string
    preferredStyle: string
    currentPhase: number
    totalPhases: number
    availableResources: { title: string; url: string; type: string; difficulty: string }[]
  }
): Promise<MLIntervention | null> {
  if (params.adaptationResult.state === 'on_track') return null

  const resourceList = params.availableResources.slice(0, 10).map((r, i) =>
    `${i}. [${r.type}/${r.difficulty}] ${r.title}`
  ).join('\n')

  const prompt = `A ${params.adaptationResult.state} learner is working on "${params.skillName}": ${params.skillDescription}
- Experience: ${params.learnerExperience}
- Learning style: ${params.preferredStyle}
- Phase: ${params.currentPhase}/${params.totalPhases}
- ML signals: ${params.adaptationResult.riskFactors.join(', ')} / ${params.adaptationResult.strengths.join(', ')}
- Dropoff risk: ${(params.adaptationResult.dropoffRisk * 100).toFixed(0)}%

Available resources:
${resourceList || 'None available'}

Design the best intervention. Choose from: add_resources, unlock_ahead, suggest_break, change_modality, pair_study, micro_goals, challenge_project, celebrate

Respond with ONLY this JSON:
{"type":"intervention_type","message":"personalized message to the learner","actionDetails":"what action to take","resources":[{"title":"...","url":"...","reason":"..."}]}

For struggling learners: be encouraging, suggest specific actionable steps.
For excelling learners: be congratulatory, offer challenging next steps.`

  try {
    const response = await llmChat(
      'You are an ML-powered adaptive learning intervention engine. Select the most effective intervention based on learner signals. Return only valid JSON.',
      prompt
    )
    const parsed = parseJSON<MLIntervention>(response)
    if (parsed && parsed.type && parsed.message) {
      return {
        type: parsed.type,
        message: parsed.message,
        actionDetails: parsed.actionDetails || '',
        resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      }
    }
  } catch (e) {
    console.error('[ML] Intervention generation failed:', e)
  }

  // Fallback interventions
  if (params.adaptationResult.state === 'struggling') {
    const beginnerResources = params.availableResources.filter(r => r.difficulty === 'beginner').slice(0, 2)
    return {
      type: 'add_resources',
      message: `It looks like ${params.skillName} is challenging right now. That's completely normal — let's build a stronger foundation with some additional resources tailored to your level.`,
      actionDetails: `Added ${beginnerResources.length} beginner-friendly resources to help solidify the fundamentals.`,
      resources: beginnerResources.map(r => ({ title: r.title, url: r.url, reason: 'Beginner-friendly resource to strengthen foundations' })),
    }
  }

  return {
    type: 'unlock_ahead',
    message: `You're crushing ${params.skillName}! Your strong performance shows you're ready for more. We've unlocked the next skill ahead of schedule.`,
    actionDetails: 'Unlocked the next roadmap item early as a reward for excellent progress.',
  }
}

// ==================== 7. ML-POWERED INTELLIGENT PROGRESSION ====================
// Replaces: hardcoded status transitions (complete→unlock 1 next)

export interface MLProgressionDecision {
  itemStatus: 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped'
  itemsToUnlock: string[] // IDs of items to unlock
  itemsToSuggest: string[] // IDs of items to suggest (not unlock, but recommend)
  progressionInsight: string
  shouldCompleteRoadmap: boolean
}

export async function mlPredictProgression(
  params: {
    completedItemId: string
    completedItemTitle: string
    completedItemSkill: string
    roadmapId: string
    allItems: { id: string; title: string; status: string; phase: number; skillName: string; sequenceOrder: number }[]
    userSkills: string[]
    completionTimeHours: number
    assessmentScore: number | null
  }
): Promise<MLProgressionDecision> {
  const lockedItems = params.allItems.filter(i => i.status === 'locked')
  const nonCompleted = params.allItems.filter(i => i.status !== 'completed' && i.status !== 'skipped')

  // If no locked items remain, check if roadmap is complete
  if (lockedItems.length === 0) {
    return {
      itemStatus: 'completed',
      itemsToUnlock: [],
      itemsToSuggest: [],
      progressionInsight: nonCompleted.length === 0 ? 'All items completed!' : 'Some items still in progress.',
      shouldCompleteRoadmap: nonCompleted.length === 0,
    }
  }

  const itemsStr = lockedItems.slice(0, 10).map(i =>
    `${i.id}|${i.title}|Phase ${i.phase}|Skill: ${i.skillName || 'N/A'}`
  ).join('\n')

  const prompt = `A learner just completed "${params.completedItemTitle}" (skill: ${params.completedItemSkill}) in ${params.completionTimeHours}h with score ${params.assessmentScore ?? 'N/A'}.

Their current skills: ${params.userSkills.join(', ')}

Locked items waiting to be unlocked:
${itemsStr}

Decide which items to unlock. Consider:
1. Prerequisite dependencies (don't unlock advanced items if prerequisites aren't done)
2. Skill transfer from completed item (if they mastered React, they can likely handle React Router)
3. Multiple items can be unlocked if the learner demonstrates strong cross-skill mastery

Respond with ONLY this JSON:
{"itemsToUnlock":["id1","id2"],"itemsToSuggest":["id3"],"progressionInsight":"brief insight about why these were chosen"}\n

Unlock 1-3 items. Be smart about it — if the learner scored high and has related skills, unlock more. If they struggled, unlock just the next sequential item.`

  try {
    const response = await llmChat(
      'You are an ML-powered learning progression engine. Decide which roadmap items to unlock based on demonstrated mastery and skill transfer. Return only valid JSON.',
      prompt
    )
    const parsed = parseJSON<{ itemsToUnlock: string[]; itemsToSuggest: string[]; progressionInsight: string }>(response)
    if (parsed && Array.isArray(parsed.itemsToUnlock)) {
      const validUnlockIds = parsed.itemsToUnlock.filter((id: string) => lockedItems.some(i => i.id === id))
      const validSuggestIds = (parsed.itemsToSuggest || []).filter((id: string) => lockedItems.some(i => i.id === id && !validUnlockIds.includes(id)))
      return {
        itemStatus: 'completed',
        itemsToUnlock: validUnlockIds,
        itemsToSuggest: validSuggestIds,
        progressionInsight: parsed.progressionInsight || 'Progressing to the next phase.',
        shouldCompleteRoadmap: nonCompleted.length - validUnlockIds.length === 0,
      }
    }
  } catch (e) {
    console.error('[ML] Progression prediction failed:', e)
  }

  // Fallback: unlock next sequential item
  const nextItem = lockedItems.sort((a, b) => a.phase === b.phase ? a.sequenceOrder - b.sequenceOrder : a.phase - b.phase)[0]
  return {
    itemStatus: 'completed',
    itemsToUnlock: nextItem ? [nextItem.id] : [],
    itemsToSuggest: [],
    progressionInsight: 'Moving to the next skill in your learning path.',
    shouldCompleteRoadmap: nonCompleted.length <= 1,
  }
}

// ==================== 8. ML-POWERED SKILL RECOMMENDATIONS ====================
// Replaces: SkillRecommendationsPanel fixed scoring formula

export interface MLSkillRecommendation {
  skillId: string
  skillName: string
  category: string
  difficulty: string
  reason: string
  reasonIcon: 'complement' | 'trending' | 'career-boost' | 'builds-on' | 'foundation'
  matchScore: number // 0-1
}

export async function mlRecommendSkills(
  params: {
    userSkills: { name: string; category: string; proficiencyLevel: string }[]
    availableSkills: { id: string; name: string; category: string; description: string; difficulty: string }[]
    goal: string
    experienceLevel: string
    maxRecommendations: number
  }
): Promise<MLSkillRecommendation[]> {
  const userSkillNames = params.userSkills.map(s => s.name)
  const unownedSkills = params.availableSkills.filter(s => !userSkillNames.includes(s.name))

  if (unownedSkills.length === 0) return []

  const skillsList = unownedSkills.slice(0, 30).map(s =>
    `${s.id}|${s.name}|${s.category}|${s.difficulty}|${(s.description || '').substring(0, 80)}`
  ).join('\n')

  const userSkillsStr = params.userSkills.map(s => `${s.name} (${s.proficiencyLevel}, ${s.category})`).join(', ')

  const prompt = `A ${params.experienceLevel} learner wants to become: ${params.goal}

Their current skills: ${userSkillsStr || 'None'}

Skills they don't have yet:
${skillsList}

Recommend the top ${params.maxRecommendations} skills they should learn next. Consider:
1. Which skills best complement their existing ones (synergy)
2. Which skills are most valuable for their goal (career impact)
3. Learning progression (don't recommend advanced skills to beginners)
4. Skill transfer potential (related skills build on each other)

Respond with ONLY this JSON array:
[{"skillId":"id","skillName":"name","reason":"personalized reason","reasonIcon":"complement|trending|career-boost|builds-on|foundation","matchScore":0.0-1.0}]


Give specific, personalized reasons — NOT generic ones.`

  try {
    const response = await llmChat(
      'You are an ML-powered skill recommendation engine. Consider skill synergies, career impact, and learning progression. Return only valid JSON.',
      prompt
    )
    const arrMatch = response.match(/\[[\s\S]*\]/)
    if (arrMatch) {
      const parsed = JSON.parse(arrMatch[0]) as Array<{ skillId: string; skillName: string; reason: string; reasonIcon: string; matchScore: number }>
      const results: MLSkillRecommendation[] = []
      for (const item of parsed) {
        const skill = unownedSkills.find(s => s.id === item.skillId || s.name === item.skillName)
        if (!skill) continue
        results.push({
          skillId: skill.id,
          skillName: skill.name,
          category: skill.category,
          difficulty: skill.difficulty,
          reason: item.reason || `Great next step for your learning journey`,
          reasonIcon: ['complement', 'trending', 'career-boost', 'builds-on', 'foundation'].includes(item.reasonIcon)
            ? item.reasonIcon as MLSkillRecommendation['reasonIcon']
            : 'complement',
          matchScore: Math.min(1, Math.max(0, item.matchScore || 0.5)),
        })
        if (results.length >= params.maxRecommendations) break
      }
      if (results.length > 0) return results
    }
  } catch (e) {
    console.error('[ML] Skill recommendation failed:', e)
  }

  // Fallback: category-based scoring
  const categoryCount: Record<string, number> = {}
  params.userSkills.forEach(s => { categoryCount[s.category] = (categoryCount[s.category] || 0) + 1 })
  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c)

  return unownedSkills
    .map(skill => ({
      skill,
      score: (topCategories.includes(skill.category) ? 20 : 0) + (skill.difficulty === 'beginner' ? 5 : skill.difficulty === 'intermediate' ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, params.maxRecommendations)
    .map(({ skill }) => ({
      skillId: skill.id,
      skillName: skill.name,
      category: skill.category,
      difficulty: skill.difficulty,
      reason: topCategories.includes(skill.category) ? `Complements your ${skill.category} expertise` : 'Great next step for your learning journey',
      reasonIcon: topCategories.includes(skill.category) ? 'complement' as const : 'trending' as const,
      matchScore: 0.5,
    }))
}

// ==================== 9. ML-POWERED COURSE META ESTIMATION ====================
// Replaces: estimateDifficulty() and estimateHours() keyword matching

export interface MLCourseMeta {
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  difficultyConfidence: number
  estimatedHours: number
  reasoning: string
}

export async function mlEstimateCourseMeta(
  title: string,
  snippet: string,
  url: string,
  skillContext: string = ''
): Promise<MLCourseMeta> {
  const cacheKey = `${title}:${url}`.substring(0, 200)
  const cached = courseMetaCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < COURSE_META_CACHE_TTL) return cached.result

  try {
    const response = await llmChat(
      'You are an ML-powered course metadata estimator. Given a course title, description snippet, and URL, estimate difficulty level and time commitment. Return only valid JSON.',
      `Title: "${title}"
Snippet: "${snippet.substring(0, 200)}"
URL: ${url}
${skillContext ? `Target skill context: ${skillContext}` : ''}

Respond with ONLY this JSON:
{"difficulty":"beginner"|"intermediate"|"advanced","difficultyConfidence":0.0-1.0,"estimatedHours":0,"reasoning":"brief explanation"}`
    )
    const parsed = parseJSON<MLCourseMeta>(response)
    if (parsed && parsed.difficulty && parsed.estimatedHours > 0) {
      const result: MLCourseMeta = {
        difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) ? parsed.difficulty : 'intermediate',
        difficultyConfidence: Math.min(1, Math.max(0, parsed.difficultyConfidence || 0.7)),
        estimatedHours: Math.max(0.5, Math.min(200, parsed.estimatedHours || 5)),
        reasoning: parsed.reasoning || '',
      }
      courseMetaCache.set(cacheKey, { result, timestamp: Date.now() })
      return result
    }
  } catch (e) {
    console.error('[ML] Course meta estimation failed:', e)
  }

  // Fallback heuristic
  const text = (title + ' ' + snippet).toLowerCase()
  let difficulty: MLCourseMeta['difficulty'] = 'intermediate'
  if (/beginner|intro|fundamental|basics|101|getting started|for beginners/i.test(text)) difficulty = 'beginner'
  else if (/advanced|expert|deep dive|master|specialized|architect/i.test(text)) difficulty = 'advanced'

  const hourMatch = text.match(/(\d+)\s*hour/)
  const weekMatch = text.match(/(\d+)\s*week/)
  let estimatedHours = 5
  if (hourMatch) estimatedHours = parseInt(hourMatch[1])
  else if (weekMatch) estimatedHours = parseInt(weekMatch[1]) * 10

  return { difficulty, difficultyConfidence: 0.5, estimatedHours, reasoning: 'Heuristic fallback estimation' }
}

// ==================== 10. ML-POWERED PERSONALIZED TIPS ====================
// Replaces: DailyTipsPanel hardcoded tips + date hash selection

export interface MLTip {
  text: string
  category: 'Productivity' | 'Memory' | 'Focus' | 'Growth Mindset' | 'Study Techniques'
  attribution: string
  isPersonalized: boolean
  relevanceContext: string // why this tip is relevant to the user RIGHT NOW
}

export async function mlGeneratePersonalizedTip(
  params: {
    userId: string
    currentSkill?: string
    currentPhase?: string
    goal?: string
    recentStruggles?: string[]
    learningStyle?: string
    streakDays?: number
    overallProgress?: number
  }
): Promise<MLTip> {
  const cacheKey = `${params.userId}:${new Date().toDateString()}`
  const cached = tipCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < TIP_CACHE_TTL) return cached.result

  const contextParts = [
    params.goal ? `Goal: ${params.goal}` : '',
    params.currentSkill ? `Currently learning: ${params.currentSkill}` : '',
    params.currentPhase ? `Phase: ${params.currentPhase}` : '',
    params.learningStyle ? `Learning style: ${params.learningStyle}` : '',
    params.streakDays ? `Study streak: ${params.streakDays} days` : '',
    params.overallProgress !== undefined ? `Overall progress: ${params.overallProgress}%` : '',
    params.recentStruggles?.length ? `Recent challenges: ${params.recentStruggles.join(', ')}` : '',
  ].filter(Boolean).join('\n')

  const prompt = `Generate ONE personalized learning tip for this learner.

${contextParts || 'No specific context available.'}

Categories: Productivity, Memory, Focus, Growth Mindset, Study Techniques

The tip should be:
1. Directly relevant to what they're currently learning or struggling with
2. Actionable — something they can apply TODAY
3. Based on evidence-based learning science
4. Brief but impactful (2-3 sentences max)

Respond with ONLY this JSON:
{"text":"the tip text","category":"Productivity|Memory|Focus|Growth Mindset|Study Techniques","attribution":"source or basis","relevanceContext":"why this is relevant to them right now"}

Do NOT give generic tips. Make it specific to their situation.`

  try {
    const response = await llmChat(
      'You are an ML-powered personalized learning coach. Generate tips that are specifically relevant to the learner\'s current situation. Return only valid JSON.',
      prompt
    )
    const parsed = parseJSON<{ text: string; category: string; attribution: string; relevanceContext: string }>(response)
    if (parsed && parsed.text && parsed.category) {
      const result: MLTip = {
        text: parsed.text,
        category: ['Productivity', 'Memory', 'Focus', 'Growth Mindset', 'Study Techniques'].includes(parsed.category)
          ? parsed.category as MLTip['category']
          : 'Productivity',
        attribution: parsed.attribution || 'AI-personalized for you',
        isPersonalized: true,
        relevanceContext: parsed.relevanceContext || 'Based on your learning context',
      }
      tipCache.set(cacheKey, { result, timestamp: Date.now() })
      return result
    }
  } catch (e) {
    console.error('[ML] Tip generation failed:', e)
  }

  // Fallback tips that are at least slightly contextual
  const fallbackTips: MLTip[] = [
    { text: 'Try the Feynman Technique: explain what you just learned in simple terms. If you can\'t explain it simply, revisit the material.', category: 'Study Techniques', attribution: 'Evidence-based learning science', isPersonalized: false, relevanceContext: 'Universal effective technique' },
    { text: 'Your brain consolidates memories during sleep. Review your notes before bed for up to 40% better retention.', category: 'Memory', attribution: 'Sleep research — Walker & Stickgold', isPersonalized: false, relevanceContext: 'Universal effective technique' },
    { text: 'Use active recall instead of re-reading. Close your notes and try to remember what you learned — the struggle of retrieval strengthens memory.', category: 'Memory', attribution: 'Roediger & Karpicke, 2006', isPersonalized: false, relevanceContext: 'Universal effective technique' },
  ]
  const idx = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % fallbackTips.length
  return fallbackTips[idx]
}

// ==================== 11. ML-POWERED ADAPTIVE QUIZ SCORING ====================
// Replaces: fixed grade thresholds + streak multiplier

export interface MLQuizScoring {
  adjustedScore: number
  difficultyRating: number // 1-5 how hard the question was for this user
  eloChange: number // Elo-style rating change
  performanceInsight: string
  suggestedDifficulty: 'easy' | 'medium' | 'hard' // what difficulty to serve next
}

export async function mlScoreQuizPerformance(
  params: {
    results: { isCorrect: boolean; timeTaken: number; category: string; difficulty?: string }[]
    totalQuestions: number
    currentElo: number
    averageTime: number
  }
): Promise<MLQuizScoring> {
  const correct = params.results.filter(r => r.isCorrect).length
  const accuracy = (correct / params.totalQuestions) * 100
  const avgTime = params.results.reduce((sum, r) => sum + r.timeTaken, 0) / params.results.length
  const fastAnswers = params.results.filter(r => r.isCorrect && r.timeTaken < 10).length

  // Calculate base Elo change
  const kFactor = 32
  const expectedScore = 1 / (1 + Math.pow(10, (1000 - params.currentElo) / 400))
  const actualScore = correct / params.totalQuestions
  const eloChange = Math.round(kFactor * (actualScore - expectedScore))

  let suggestedDifficulty: MLQuizScoring['suggestedDifficulty'] = 'medium'
  if (accuracy >= 80 && avgTime < 15) suggestedDifficulty = 'hard'
  else if (accuracy <= 40) suggestedDifficulty = 'easy'

  const prompt = `Analyze this quiz performance:
- ${correct}/${params.totalQuestions} correct (${accuracy.toFixed(0)}%)
- Average time per question: ${avgTime.toFixed(1)}s
- Fast correct answers (<10s): ${fastAnswers}
- Current Elo rating: ${params.currentElo}

Category breakdown: ${Object.entries(
    params.results.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + (r.isCorrect ? 1 : 0); return acc }, {} as Record<string, number>)
  ).map(([cat, correct]) => `${cat}: ${correct}/${params.results.filter(r => r.category === cat).length}`).join(', ')}

Respond with ONLY this JSON:
{"adjustedScore":0-100,"difficultyRating":1-5,"eloChange":${eloChange},"performanceInsight":"specific insight about their performance","suggestedDifficulty":"easy|medium|hard"} 

Be specific about strengths and weaknesses. The insight should be actionable.`

  try {
    const response = await llmChat(
      'You are an ML-powered quiz analytics engine. Analyze performance patterns and provide specific insights. Return only valid JSON.',
      prompt
    )
    const parsed = parseJSON<MLQuizScoring>(response)
    if (parsed && parsed.performanceInsight) {
      return {
        adjustedScore: Math.min(100, Math.max(0, parsed.adjustedScore || accuracy)),
        difficultyRating: Math.min(5, Math.max(1, parsed.difficultyRating || 3)),
        eloChange: parsed.eloChange ?? eloChange,
        performanceInsight: parsed.performanceInsight,
        suggestedDifficulty: ['easy', 'medium', 'hard'].includes(parsed.suggestedDifficulty)
          ? parsed.suggestedDifficulty
          : suggestedDifficulty,
      }
    }
  } catch (e) {
    console.error('[ML] Quiz scoring failed:', e)
  }

  return {
    adjustedScore: accuracy,
    difficultyRating: accuracy > 80 ? 4 : accuracy > 50 ? 3 : 2,
    eloChange,
    performanceInsight: accuracy >= 80 ? 'Strong performance! You have a solid grasp of the material.' : accuracy >= 50 ? 'Good effort — review the topics you missed to strengthen weak areas.' : 'Keep practicing! Focus on the fundamentals before moving to more advanced topics.',
    suggestedDifficulty,
  }
}

// ==================== 12. ML-POWERED DURATION SCALING ====================
// Replaces: generateFallbackRoadmap fixed speed factor

export async function mlEstimateLearningVelocity(
  params: {
    hoursPerWeek: number
    experienceLevel: string
    learningStyle: string
    targetComplexity: 'low' | 'medium' | 'high'
    historicalCompletionRate?: number
  }
): Promise<{ velocityFactor: number; reasoning: string; estimatedTotalWeeks: number }> {
  try {
    const response = await llmChat(
      'You are an ML-powered learning velocity estimator. Estimate how quickly a learner will progress based on their profile. Return only valid JSON.',
      `Learner profile:
- Hours per week: ${params.hoursPerWeek}
- Experience: ${params.experienceLevel}
- Learning style: ${params.learningStyle}
- Target complexity: ${params.targetComplexity}
- Historical completion rate: ${params.historicalCompletionRate ?? 'unknown'}%

Respond with ONLY this JSON:
{"velocityFactor":0.5-2.0,"reasoning":"brief explanation","estimatedTotalWeeks":0}

velocityFactor > 1.0 means faster than average, < 1.0 means slower. Base estimate is 24 weeks. Be realistic but encouraging.`
    )
    const parsed = parseJSON<{ velocityFactor: number; reasoning: string; estimatedTotalWeeks: number }>(response)
    if (parsed && parsed.velocityFactor) {
      return {
        velocityFactor: Math.min(2, Math.max(0.5, parsed.velocityFactor)),
        reasoning: parsed.reasoning || '',
        estimatedTotalWeeks: Math.max(4, parsed.estimatedTotalWeeks || 24),
      }
    }
  } catch (e) {
    console.error('[ML] Learning velocity estimation failed:', e)
  }

  // Fallback
  const baseFactor = params.hoursPerWeek >= 20 ? 1.3 : params.hoursPerWeek >= 10 ? 1.0 : params.hoursPerWeek >= 5 ? 0.8 : 0.6
  const expFactor = params.experienceLevel === 'advanced' ? 1.2 : params.experienceLevel === 'intermediate' ? 1.0 : 0.8
  return {
    velocityFactor: baseFactor * expFactor,
    reasoning: 'Estimated from hours and experience level',
    estimatedTotalWeeks: 24,
  }
}
