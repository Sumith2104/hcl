# Task ID: 5 - Skill Recommendations Panel Agent

## Task
Create `SkillRecommendationsPanel.tsx` - a 'use client' dashboard component that recommends skills the user should learn next based on their profile.

## Work Log
- Read `worklog.md` for full project context (PathAI learning platform)
- Examined existing dashboard components (`DailyTipsPanel.tsx`, `SkillExplorerPanel.tsx`) for code patterns
- Examined `store/index.ts` for Zustand state shape and `user` access pattern
- Examined `DashboardView.tsx` for API fetch patterns (`/api/profile?userId=xxx`, `/api/skills`)
- Examined `skeleton.tsx` and `card.tsx` for shadcn/ui component usage
- Created `/home/z/my-project/src/components/dashboard/SkillRecommendationsPanel.tsx`

## Implementation Details

### Data Fetching
- Fetches user skills from `/api/profile?userId=${user.id}` via `useAppStore()`
- Fetches all skills from `/api/skills`
- Uses `useEffect` with cleanup flag to prevent state updates on unmounted component

### Recommendation Algorithm
- Filters out skills the user already has by comparing `skill.id`
- Computes top 3 categories from user's existing skills
- Scores unowned skills: +30/20/10 for matching top 1/2/3 category, +2 for beginner, +1 for intermediate
- Sorts by score descending and takes top 8

### Reason Generation
- **Complement** (TrendingUp icon): when skill's category matches user's top categories
- **Popular** (Compass icon): when in top category but no reference skill found
- **Builds-on** (BookOpen icon): when category doesn't match, references any user skill

### UI Design
- Card with teal Sparkles icon, "Recommended For You" title, emerald count badge
- Each recommendation item: skill name (bold), category badge (colored per category), difficulty badge (emerald/amber/rose)
- Reason text with matching icon
- Small outline "Add to Profile" button with disabled/added state
- Toast notification via `sonner` on add
- Staggered entrance animation via framer-motion (0.06s delay per item)
- Loading skeleton state (4 rows)
- Empty state with Sparkles icon + friendly message
- `max-h-80 overflow-y-auto` scroll container

### Verification
- `bun run lint` — passed with zero errors
- Dev server compiles successfully

## Stage Summary
- Created `SkillRecommendationsPanel.tsx` with full recommendation logic, animated UI, loading/empty states
- No existing files modified
- Follows all project conventions
