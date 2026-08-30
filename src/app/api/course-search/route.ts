import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// In-memory cache for course search results
const courseCache = new Map<string, { data: CourseResult[]; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CourseResult {
  title: string
  url: string
  description: string
  type: 'course' | 'video' | 'article' | 'tutorial' | 'documentation'
  platform: string
  estimatedHours: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

function getZAIInstance() {
  return ZAI.create()
}

// Known free course platforms with their domains
const FREE_PLATFORMS = [
  { name: 'freeCodeCamp', domain: 'freecodecamp.org', type: 'course' as const },
  { name: 'YouTube', domain: 'youtube.com', type: 'video' as const },
  { name: 'Khan Academy', domain: 'khanacademy.org', type: 'course' as const },
  { name: 'MIT OCW', domain: 'ocw.mit.edu', type: 'course' as const },
  { name: 'Coursera', domain: 'coursera.org', type: 'course' as const },
  { name: 'edX', domain: 'edx.org', type: 'course' as const },
  { name: 'Kaggle', domain: 'kaggle.com', type: 'course' as const },
  { name: 'The Odin Project', domain: 'theodinproject.com', type: 'course' as const },
  { name: 'Codecademy', domain: 'codecademy.com', type: 'course' as const },
  { name: 'W3Schools', domain: 'w3schools.com', type: 'tutorial' as const },
  { name: 'MDN Web Docs', domain: 'developer.mozilla.org', type: 'documentation' as const },
  { name: 'Real Python', domain: 'realpython.com', type: 'article' as const },
  { name: 'Fast.ai', domain: 'fast.ai', type: 'course' as const },
  { name: 'Stanford Online', domain: 'online.stanford.edu', type: 'course' as const },
  { name: 'Google AI', domain: 'ai.google', type: 'course' as const },
  { name: 'AWS Training', domain: 'aws.amazon.com', type: 'course' as const },
  { name: 'Microsoft Learn', domain: 'learn.microsoft.com', type: 'course' as const },
  { name: 'PyTorch', domain: 'pytorch.org', type: 'documentation' as const },
  { name: 'TensorFlow', domain: 'tensorflow.org', type: 'documentation' as const },
  { name: 'Medium', domain: 'medium.com', type: 'article' as const },
]

function identifyPlatform(url: string, snippet: string): { name: string; domain: string; type: CourseResult['type'] } {
  for (const platform of FREE_PLATFORMS) {
    if (url.includes(platform.domain) || snippet.toLowerCase().includes(platform.name.toLowerCase())) {
      return { name: platform.name, domain: platform.domain, type: platform.type }
    }
  }
  // Default detection
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return { name: 'YouTube', domain: 'youtube.com', type: 'video' }
  }
  if (url.includes('docs.')) {
    return { name: 'Documentation', domain: new URL(url.startsWith('http') ? url : `https://${url}`).hostname, type: 'documentation' }
  }
  if (url.includes('tutorial') || url.includes('guide') || url.includes('workshop')) {
    return { name: 'Tutorial', domain: '', type: 'tutorial' }
  }
  return { name: 'Web Resource', domain: '', type: 'article' }
}

function estimateDifficulty(query: string, snippet: string): CourseResult['difficulty'] {
  const text = (query + ' ' + snippet).toLowerCase()
  if (text.includes('beginner') || text.includes('intro') || text.includes('fundamental') || text.includes('basics') || text.includes('101') || text.includes('getting started')) {
    return 'beginner'
  }
  if (text.includes('advanced') || text.includes('expert') || text.includes('deep dive') || text.includes('master')) {
    return 'advanced'
  }
  return 'intermediate'
}

function sanitizeUrl(url: string): string {
  if (!url) return ''
  url = url.trim()
  // Fix common AI-generated URL mistakes: "https/example.com" → "https://example.com"
  // Also handles "http:/x", "https:x", "https:///x" etc.
  url = url.replace(/^(https?)[\/:]*/, '$1://')
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('//')) {
    return 'https:' + url
  }
  if (url.startsWith('www.')) {
    return 'https://' + url
  }
  // If it looks like a domain (contains a dot)
  if (url.includes('.') && !url.includes(' ')) {
    return 'https://' + url
  }
  return url
}

function estimateHours(type: CourseResult['type'], title: string, snippet: string): number {
  const text = (title + ' ' + snippet).toLowerCase()
  // Try to extract hours from text
  const hourMatch = text.match(/(\d+)\s*hour/i)
  if (hourMatch) return parseInt(hourMatch[1])
  const weekMatch = text.match(/(\d+)\s*week/i)
  if (weekMatch) return parseInt(weekMatch[1]) * 10

  // Default by type
  switch (type) {
    case 'course': return 15
    case 'video': return 4
    case 'article': return 1
    case 'tutorial': return 6
    case 'documentation': return 3
    default: return 5
  }
}

async function searchCoursesForSkill(skillName: string, goal: string): Promise<CourseResult[]> {
  const cacheKey = `${skillName}:${goal}`.toLowerCase()
  const cached = courseCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  const zai = await getZAIInstance()
  const allResults: CourseResult[] = []

  // Search 1: Free courses specifically
  const freeQuery = `best free ${skillName} course tutorial ${goal}`
  const freeResults = await zai.functions.invoke('web_search', { query: freeQuery, num: 8 })

  // Search 2: From specific platforms
  const platformQuery = `${skillName} course site:freecodecamp.org OR site:khanacademy.org OR site:coursera.org OR site:youtube.com`
  const platformResults = await zai.functions.invoke('web_search', { query: platformQuery, num: 5 })

  // Combine and deduplicate results
  const seenUrls = new Set<string>()
  const allSearchResults = [...(freeResults || []), ...(platformResults || [])]

  for (const result of allSearchResults) {
    const url = sanitizeUrl(result.url || '')
    if (!url || seenUrls.has(url)) continue
    // Skip non-useful results
    if (url.includes('pinterest.com') || url.includes('facebook.com') || url.includes('twitter.com') || url.includes('instagram.com')) continue
    seenUrls.add(url)

    const platform = identifyPlatform(url, result.snippet || '')
    allResults.push({
      title: result.name || `${skillName} Resource`,
      url,
      description: result.snippet || `Learn ${skillName} for ${goal}`,
      type: platform.type,
      platform: platform.name,
      estimatedHours: estimateHours(platform.type, result.name || '', result.snippet || ''),
      difficulty: estimateDifficulty(skillName, result.snippet || ''),
    })
  }

  // Sort: prioritize free platforms, then by relevance
  const priorityDomains = ['freecodecamp.org', 'khanacademy.org', 'ocw.mit.edu', 'theodinproject.com', 'kaggle.com', 'fast.ai', 'youtube.com', 'coursera.org', 'edx.org', 'realpython.com', 'developer.mozilla.org']
  allResults.sort((a, b) => {
    const aPriority = priorityDomains.findIndex(d => a.url.includes(d))
    const bPriority = priorityDomains.findIndex(d => b.url.includes(d))
    if (aPriority === -1 && bPriority === -1) return 0
    if (aPriority === -1) return 1
    if (bPriority === -1) return -1
    return aPriority - bPriority
  })

  const topResults = allResults.slice(0, 8)
  courseCache.set(cacheKey, { data: topResults, timestamp: Date.now() })
  return topResults
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { skills, goal } = body

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: 'skills array is required' }, { status: 400 })
    }
    if (!goal) {
      return NextResponse.json({ error: 'goal is required' }, { status: 400 })
    }

    // Search for courses for each skill (limit concurrent to avoid rate limiting)
 const results: Record<string, CourseResult[]> = {}
    const batchSize = 3
    for (let i = 0; i < skills.length; i += batchSize) {
      const batch = skills.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (skill: string) => {
          try {
            const courses = await searchCoursesForSkill(skill, goal)
            return { skill, courses }
          } catch (e) {
            console.error(`Course search failed for ${skill}:`, e)
            return { skill, courses: [] }
          }
        })
      )
      for (const r of batchResults) {
        results[r.skill] = r.courses
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Course search error:', error)
    return NextResponse.json({ error: 'Failed to search courses' }, { status: 500 })
  }
}

// Also support GET for simpler queries
export async function GET(req: NextRequest) {
  try {
    const skill = req.nextUrl.searchParams.get('skill')
    const goal = req.nextUrl.searchParams.get('goal') || ''

    if (!skill) {
      return NextResponse.json({ error: 'skill query parameter is required' }, { status: 400 })
    }

    const courses = await searchCoursesForSkill(skill, goal)
    return NextResponse.json({ skill, courses })
  } catch (error) {
    console.error('Course search error:', error)
    return NextResponse.json({ error: 'Failed to search courses' }, { status: 500 })
  }
}
