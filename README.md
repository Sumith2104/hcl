<div align="center">

# Study Buddies

**AI-Powered Personalized Learning Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-18181B)](https://ui.shadcn.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?logo=framer)](https://www.framer.com/motion/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

<p>
  <img src="public/logo.svg" alt="Study Buddies Logo" width="120" />
</p>

<p>
  <b>Study Buddies</b> is a full-stack AI learning platform that uses conversational AI to understand your goals, generates personalized learning roadmaps with real curated resources, tracks your progress with spaced repetition and adaptive quizzes, and provides an ML engine that continuously adapts to your learning pace.
</p>

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [AI / ML Engine](#ai--ml-engine)
- [Dashboard Panels](#dashboard-panels)
- [API Routes](#api-routes)
- [Design System](#design-system)
- [Performance](#performance)
- [Security](#security)
- [Demo Video Script](#demo-video-script)
- [License](#license)

---

## Features

### Core Platform

| Feature | Description |
|---------|-------------|
| **AI Onboarding** | Conversational 5-stage chat that extracts your learning goals, current skills, and experience level through natural dialogue |
| **AI Roadmap Generation** | LLM-powered generation of 4-5 phase personalized learning paths with goal-specific skills and real curated resources |
| **AI Learning Assistant** | Context-aware chatbot that knows your profile, roadmap, and progress — answers questions and suggests study strategies |
| **Adaptive ML Engine** | 12 ML functions replace 27 rule-based features: learner state classification, semantic resource matching, Elo-rated quiz scoring, adaptive interventions |
| **Spaced Repetition** | Full SM-2 algorithm flashcard system with 36 cards across 6 categories, 3D flip animations, and quiz mode |
| **Community & Gamification** | Achievement system (12 badges, 4 rarity tiers), leaderboard, streak tracking, and activity feed |

### Landing Page

- **Particle Constellation Canvas** — 55 animated particles with mouse-repulsion and proximity connection lines
- **Animated Stat Counters** — IntersectionObserver-triggered counting animation (10,000+ learners, 500+ paths, 60+ skills, 95% satisfaction)
- **Feature Cards** — Glassmorphism cards with animated gradient border overlays and sweep hover effects
- **How It Works** — 4-step sequential reveal with pulsing ring nodes and gradient connector lines
- **Testimonials** — Auto-rotating carousel (mobile) / grid layout (desktop) with star ratings
- **FAQ** — Accessible Accordion component with hover highlights
- **CTA Section** — Mesh gradient background with floating animated icons and rotating conic-gradient button border

### Authentication

- Email + password registration and login
- Real-time password strength indicator (8+ chars, uppercase, lowercase, number)
- Show/hide password toggle
- SHA-256 password hashing with unique salt (1,000 iterations) via Web Crypto API
- Constant-time comparison to prevent timing attacks
- Duplicate email detection (409 Conflict)

### Onboarding Chat

- 5-stage progress stepper (Welcome → Goals → Skills → Experience → Complete)
- Glassmorphism AI message bubbles with Brain icon avatar
- Gradient user message bubbles
- CSS-animated typing indicator (bouncing dots)
- Step-aware quick reply suggestion pills
- Animated welcome screen with sparkle particles and spring-animated logo
- Smooth auto-scroll on new messages

### Dashboard (9 Tabs, 19+ Panels)

| Tab | Panels |
|-----|--------|
| **Overview** | Welcome banner with live streak, skill summary badges, radar chart, quick actions, Pomodoro timer, daily AI tips, weekly AI summary, activity heatmap, goal tracker, AI skill recommendations |
| **Analytics** | Learning metrics (bar charts + category breakdown), achievements showcase, community leaderboard |
| **Explore Skills** | 82 skills across 9 categories with search, filter, and interactive proficiency selectors |
| **Resources & Goals** | Resource library with bookmarking, learning goal tracker with deadlines |
| **Activity** | GitHub-style activity heatmap, study session logger, AI-powered skill recommendations |
| **Study Tools** | Flashcard study tool (SM-2, 3D flip, quiz mode), quiz challenge panel |
| **Skill Tree** | Interactive SVG graph (32+ nodes, Bézier curves, zoom/pan, minimap, search, focus mode) |
| **Community** | Real activity feed, ranked leaderboard computed from actual data |
| **Challenges** | Streak calendar with milestone badges, adaptive quiz challenges |

### Study Tools

- **Pomodoro Timer** — 3 modes (Focus 25m, Short Break 5m, Long Break 15m), SVG gradient progress ring, audio beep via Web Audio API, 4-session cycle tracking
- **Flashcard System** — 36 cards across 6 categories, SM-2 spaced repetition algorithm, Deck / Flashcard / Quiz modes, keyboard shortcuts (Space=flip, 1-4=rate, arrows=navigate), session statistics and accuracy tracking
- **Quiz Challenge** — ML-adaptive scoring with Elo rating, multiple difficulty levels, performance analysis
- **Learning Journal** — Full CRUD notes with categories (general, insight, question, resource, breakthrough), tags, search, pin/unpin

### Roadmap

- Multi-phase timeline with connected nodes and completion-aware dot indicators
- Expandable phases showing skills, milestones, and duration estimates
- Clickable resource cards with type-colored badges (course, video, article, tutorial, documentation)
- Real curated resources from freeCodeCamp, YouTube, MIT OCW, Coursera, Khan Academy, MDN, Kaggle
- PDF export with print-optimized layout
- Progress tracking per item

### Profile

- Cover banner with overlapping avatar
- 4 animated stat cards (Skills, Streak, Completed, Hours)
- Activity heatmap integration
- Animated skill proficiency bars
- Achievement showcase with rarity glow effects (Common, Great, Rare, Legendary)
- Learning journey timeline
- Preferences panel (theme toggle, daily learning goal, notification settings)
- Inline name editing

### System Features

- **Dark/Light Mode** — System-aware theme with next-themes
- **Notifications** — Bell icon with animated unread badge, 4 types (system, reminder, achievement, tip), mark all read
- **Keyboard Shortcuts** — Global shortcut hints overlay
- **Session Persistence** — Zustand + localStorage, seamless refresh recovery
- **Error Boundary** — Class component with user-friendly recovery UI
- **Responsive Design** — Mobile-first with sm/md/lg/xl breakpoints
- **Accessibility** — Semantic HTML, ARIA attributes, screen reader support, focus-visible outlines
- **Sticky Footer** — Natural push on overflow, bottom-pinned on short pages

---

## Tech Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|--------|
| [Next.js](https://nextjs.org/) | 16 | React framework with App Router |
| [React](https://react.dev/) | 19 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Latest | 40+ Radix UI components (New York style) |

### State & Data

| Technology | Purpose |
|------------|--------|
| [Zustand](https://zustand.docs.pmnd.rs/) | Client state management with localStorage persistence |
| [TanStack Query](https://tanstack.com/query) | Server state caching |
| [FluxBase](https://fluxbase.io/) | Cloud-hosted PostgreSQL via REST API |
| [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) | LLM integration for all AI features |

### UI & Animation

| Technology | Purpose |
|------------|--------|
| [Framer Motion](https://www.framer.com/motion/) | Animations, transitions, gestures |
| [Lucide React](https://lucide.dev/) | Icon library (500+ icons) |
| [Recharts](https://recharts.org/) | Data visualization (bar charts, radar, etc.) |
| [Sonner](https://sonner.emilkowal.dev/) | Toast notifications |

### Developer Tools

| Technology | Purpose |
|------------|--------|
| ESLint | Code quality |
| Prisma | Schema definition (local SQLite for development) |
| Bun | Package manager and runtime |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐






  Client (Browser)
  ┌─────────────────────────────────────────────────────────────┐
  │  Next.js 16 App Router (Single Page — / route only)          │
  │  Client-side view switching via Zustand                       │
  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────┐  │
  │  │ Landing  │ │   Auth    │ │Onboarding│ │   Dashboard    │  │
  │  │  Page    │ │   View    │ │  Chat    │ │  (9 tabs,     │  │
  │  │          │ │           │ │          │ │   19 panels)   │  │
  │  └──────────┘ └───────────┘ └──────────┘ ├───────────────┤  │
  │                                        │  Roadmap View  │  │
  │  Dynamic imports (next/dynamic)         │  AI Assistant  │  │
  │  Skeleton loading fallbacks             │  Profile View  │  │
  │  Hydration-safe SSR (useIsMounted)      └───────────────┘  │
  └────────────────────────┬────────────────────────────────────┘
                           │ fetch() with 8s timeout
                           ▼
  Server (Next.js API Routes)
  ┌─────────────────────────────────────────────────────────────┐
  │  27 API Route Handlers                                      │
  │  ┌─────────────────────────────────────────────────────────┐│
  │  │ Core: auth, profile, skills, onboarding, roadmap,       ││
  │  │       progress, chat, assistant, notes                   ││
  │  │ Data: analytics, activity, streak, study-sessions,      ││
  │  │       resources, skill-tree, course-search               ││
  │  │ ML:   ml/recommendations, ml/tips, ml/quiz-analysis     ││
  │  │ System: health, weekly-summary, notifications,           ││
  │  │        achievements, learning-goals, quiz-questions,     ││
  │  │        flashcards                                          ││
  │  └─────────────────────────────────────────────────────────┘│
  │                                                             │
  │  Safe FluxBase wrapper (fluxbase-safe.ts)                   │
  │  → Dynamic import, module-level cache, 15s timeout          │
  │  → Automatic table creation on first query                  │
  └──────────┬──────────────────────────┬───────────────────────┘
             │                          │
             ▼                          ▼
  ┌──────────────────┐    ┌──────────────────────────────────┐
  │  FluxBase         │    │  z-ai-web-dev-sdk                │
  │  (PostgreSQL)     │    │  (LLM Backend)                   │
  │                  │    │                                  │
  │  16+ tables      │    │  Onboarding chat                 │
  │  REST API        │    │  Roadmap generation              │
  │  Bearer Token    │    │  AI assistant                    │
  │  auth            │    │  Weekly summary                  │
  │                  │    │  ML engine (12 functions)        │
  │  70+ curated     │    │                                  │
  │  resources       │    │  In-memory caches (5min-24hr TTL)│
  └──────────────────┘    └──────────────────────────────────┘
```

### Key Architecture Decisions

- **Single-page app with client-side routing** — Only the `/` route exists. View switching (landing, auth, onboarding, dashboard, roadmap, assistant, profile) is handled by Zustand state, not Next.js file-based routing. This avoids full-page navigation and enables seamless transitions.
- **FluxBase safe wrapper** — All database access goes through `fluxbase-safe.ts` which uses dynamic `import()` inside try/catch. This prevents module-level crashes from taking down the entire serverless function. The FluxBase client is cached after first initialization.
- **AI only on the backend** — The `z-ai-web-dev-sdk` is only imported and used in API route handlers (server-side). No AI SDK code ships to the client.
- **ML engine with deterministic fallbacks** — All 12 ML functions have intelligent rule-based fallbacks. If the LLM call fails or times out, the system degrades gracefully rather than showing errors.
- **Curated resource database** — Roadmap resources come from a curated database of 70+ verified URLs matched via TF-IDF keyword scoring, not hallucinated by the LLM. This guarantees every link is real and functional.
- **Batch database operations** — Roadmap generation uses chunked INSERT queries (15-20 rows per batch) instead of 70+ sequential queries, reducing DB write time from ~30s to ~4s.
- **Hydration-safe SSR** — A custom `useIsMounted` hook (built on `useSyncExternalStore`) gates all Date/time-dependent rendering behind client-side mount, preventing hydration mismatches on serverless platforms.

---

## Project Structure

```
study-buddies/
├── public/
│   └── logo.svg                          # App logo
├── prisma/
│   └── schema.prisma                     # Local SQLite schema (development)
├── src/
│   ├── app/
│   │   ├── globals.css                   # Global styles (2,350+ lines, 100+ custom classes)
│   │   ├── layout.tsx                    # Root layout with providers
│   │   ├── page.tsx                      # Main entry — view router + session restore
│   │   └── api/                          # 27 API route handlers
│   │       ├── auth/route.ts             #   Signup + Login (password hashing)
│   │       ├── profile/route.ts          #   Get/create/update learner profile
│   │       ├── skills/route.ts           #   List skills + roles
│   │       ├── onboarding/route.ts       #   AI onboarding chat + profile extraction
│   │       ├── roadmap/route.ts          #   Generate + get AI roadmaps
│   │       ├── progress/route.ts         #   Update progress + adaptive trigger
│   │       ├── chat/route.ts             #   Chat history for AI assistant
│   │       ├── assistant/route.ts        #   AI assistant conversations
│   │       ├── notes/route.ts            #   Learning journal CRUD
│   │       ├── study-sessions/route.ts   #   Study session logging
│   │       ├── analytics/route.ts        #   Learning analytics metrics
│   │       ├── activity/route.ts         #   Activity data for heatmap
│   │       ├── streak/route.ts           #   Learning streak calculation
│   │       ├── resources/route.ts        #   Resource library + bookmarks
│   │       ├── skill-tree/route.ts       #   Skill graph data
│   │       ├── course-search/route.ts    #   ML-powered course search
│   │       ├── weekly-summary/route.ts   #   AI weekly summary
│   │       ├── notifications/route.ts    #   Notification CRUD
│   │       ├── achievements/route.ts     #   Achievement tracking
│   │       ├── learning-goals/route.ts   #   Goal CRUD + progress
│   │       ├── quiz-questions/route.ts   #   Quiz question bank
│   │       ├── flashcards/route.ts       #   Flashcard data
│   │       ├── health/route.ts           #   Health check + diagnostics
│   │       ├── ml/
│   │       │   ├── recommendations/route.ts  # ML skill recommendations
│   │       │   ├── tips/route.ts             # ML personalized tips
│   │       │   └── quiz-analysis/route.ts    # ML adaptive quiz scoring
│   │       └── route.ts                 #   Root API handler
│   ├── components/
│   │   ├── ui/                           # 40+ shadcn/ui components
│   │   ├── landing/
│   │   │   ├── LandingPage.tsx           # Full landing page (725+ lines)
│   │   │   └── ParticleCanvas.tsx        # 55-particle constellation canvas
│   │   ├── auth/
│   │   │   └── AuthView.tsx              # Sign up + Login with password
│   │   ├── onboarding/
│   │   │   └── OnboardingView.tsx        # AI chat onboarding (600+ lines)
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx         # Main dashboard (9 tabs, 19+ panels)
│   │   │   ├── PomodoroTimer.tsx         # Focus/break timer with SVG ring
│   │   │   ├── AchievementsPanel.tsx     # 12 badges, 4 rarity tiers
│   │   │   ├── DailyTipsPanel.tsx        # AI-powered daily tips
│   │   │   ├── LeaderboardPanel.tsx      # Community rankings with podium
│   │   │   ├── NotesPanel.tsx            # Learning journal with CRUD
│   │   │   ├── SkillExplorerPanel.tsx    # 82 skills, 9 categories
│   │   │   ├── LearningAnalyticsPanel.tsx # Charts + metrics
│   │   │   ├── WeeklySummaryCard.tsx     # AI weekly insight
│   │   │   ├── GoalTrackerPanel.tsx      # Learning goals with deadlines
│   │   │   ├── ResourceLibraryPanel.tsx  # Curated resource library
│   │   │   ├── ActivityHeatmap.tsx       # GitHub-style heatmap
│   │   │   ├── StudySessionLogger.tsx    # Session tracking
│   │   │   ├── SkillRecommendationsPanel.tsx # ML-powered recommendations
│   │   │   ├── FlashcardStudyTool.tsx    # SM-2 flashcards (1,770 lines)
│   │   │   ├── SkillTreeVisualization.tsx # Interactive graph (973 lines)
│   │   │   ├── CommunityFeedPanel.tsx    # Real activity feed
│   │   │   ├── QuizChallengePanel.tsx    # Adaptive quiz challenges
│   │   │   └── StreakCalendarPanel.tsx   # Streak calendar + milestones
│   │   ├── roadmap/
│   │   │   ├── RoadmapView.tsx           # Roadmap timeline + resources
│   │   │   └── RoadmapPDFExport.tsx      # PDF export with print preview
│   │   ├── chat/
│   │   │   └── AssistantView.tsx         # AI assistant chat interface
│   │   ├── profile/
│   │   │   └── ProfileView.tsx           # Full profile (666+ lines)
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx             # Header with nav, search, notifications
│   │   │   ├── AppFooter.tsx             # Context-aware footer
│   │   │   ├── NotificationsPanel.tsx    # Notification sidebar
│   │   │   └── KeyboardShortcuts.tsx     # Global shortcut hints
│   │   ├── icons/
│   │   │   ├── StudyBuddiesLogo.tsx      # Full logo (icon + text)
│   │   │   └── StudyBuddiesIcon.tsx      # Square icon only
│   │   └── ErrorBoundary.tsx            # Error recovery boundary
│   ├── lib/
│   │   ├── ai-engine.ts                  # AI functions (onboarding, roadmap, assistant)
│   │   ├── ml-engine.ts                  # ML engine (12 functions, 1,018 lines)
│   │   ├── fluxbase.ts                   # FluxBase client (query, execute, 15s timeout)
│   │   ├── fluxbase-safe.ts             # Safe dynamic-import wrapper with cache
│   │   ├── fluxbase-schema.ts           # 16+ table definitions + auto-creation
│   │   ├── password.ts                   # SHA-256 hashing utility
│   │   ├── db.ts                         # Prisma client (local dev only)
│   │   └── utils.ts                     # Utility functions (cn, etc.)
│   ├── store/
│   │   └── index.ts                     # Zustand store (state, actions, persistence)
│   └── hooks/
│       └── use-is-mounted.ts            # Hydration-safe SSR hook
├── scripts/
│   └── seed-fluxbase.ts                  # Database seeding script
├── .env.local                            # Environment variables (not committed)
├── next.config.ts                        # Next.js config (standalone output)
├── package.json                          # Dependencies and scripts
├── tsconfig.json                         # TypeScript configuration
└── DEMO-VIDEO-SCRIPT.md                   # Demo video narration script
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/) latest
- A [FluxBase](https://fluxbase.io/) account with API key, base URL, and project ID
- A [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) access (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/study-buddies.git
cd study-buddies

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Seeding the Database

After setting up your FluxBase credentials, seed the database with skills, prerequisites, role requirements, and curated resources:

```bash
bun run scripts/seed-fluxbase.ts
```

This populates:
- 60+ skills across 11 categories
- 73 prerequisite relationships
- 85 role-skill requirements across 9 target roles
- 70+ curated learning resources with real URLs

> Tables are auto-created on the first API request if seeding hasn't been run yet.

### Production Build

```bash
bun run build
bun run start
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# FluxBase (Cloud PostgreSQL)
FLUXBASE_API_KEY=your_fluxbase_api_key
FLUXBASE_BASE_URL=https://your-fluxbase-instance.com
FLUXBASE_PROJECT_ID=your_project_id

# z-ai-web-dev-sdk (auto-configured by the SDK)
# No manual env vars needed — the SDK handles its own auth
```

---

## Database Schema

The application uses 16 tables in FluxBase (PostgreSQL):

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `app_user` | User accounts | id, name, email, password_hash, role |
| `learner_profile` | Learning profiles | user_id, target_goal, experience_level, available_hours_per_week |
| `skill` | Skill catalog | id, name, category, description |
| `skill_prerequisite` | Skill dependencies | skill_id, prerequisite_skill_id, importance |
| `role_skill_requirement` | Role-skill mapping | target_role, skill_id, required_level |
| `user_skill` | User skill levels | user_id, skill_id, proficiency_level, confidence_score |
| `resource` | Learning resources | id, title, url, type, difficulty, estimated_hours, quality_score |
| `resource_skill` | Resource-skill links | resource_id, skill_id |
| `roadmap` | Generated roadmaps | user_id, target_goal, estimated_duration_weeks, status |
| `roadmap_item` | Roadmap phases & skills | roadmap_id, phase, sequence_order, title, estimated_hours, milestone, status |
| `roadmap_resource` | Resource assignments | roadmap_item_id, resource_id, recommendation_reason |
| `progress` | Learning progress | user_id, roadmap_item_id, completion_percentage, assessment_score |
| `onboarding_message` | Onboarding chat history | user_id, role, content, step |
| `chat_message` | AI assistant history | user_id, role, content |
| `learning_note` | User notes | user_id, title, content, category, tags, is_pinned |
| `study_session` | Study session log | user_id, skill_name, duration, notes, type |
| `quiz_question` | Quiz bank | category, question, options, correct_answer, difficulty |
| `flashcard` | Flashcard bank | category, question, answer, difficulty |
| `user_achievement` | Earned achievements | user_id, achievement_id, earned_at |
| `notification` | User notifications | user_id, type, title, description, is_read |
| `learning_goal` | Learning goals | user_id, title, deadline, progress, category, completed |
| `resource_bookmark` | Bookmarked resources | user_id, resource_id |

---

## AI / ML Engine

### AI Features (z-ai-web-dev-sdk)

| Feature | How It Works |
|---------|-------------|
| **Onboarding Chat** | Multi-turn LLM conversation extracts target role, skills, and experience from natural dialogue |
| **Roadmap Generation** | Single LLM call generates 4-5 phases with 3 skills each. Resources are matched locally from curated DB via TF-IDF |
| **AI Assistant** | Context-aware chat with profile + roadmap + progress awareness. History persisted across sessions |
| **Weekly Summary** | Aggregates progress, roadmap status, and chat history into a personalized weekly review |

### ML Engine (12 Functions)

All ML functions use LLM via z-ai-web-dev-sdk with intelligent deterministic fallbacks:

| # | Function | Purpose | Fallback |
|---|----------|---------|----------|
| 1 | `mlEvaluateAdaptation` | Classifies learner state (struggling/on_track/excelling) with risk factors | Rule-based classification |
| 2 | `mlMatchResources` | Semantic resource-to-skill matching | TF-IDF keyword scoring |
| 3 | `mlDetectDomain` | LLM text classification for learning domains | Regex pattern matching |
| 4 | `mlAnalyzeSkillGaps` | Skill gap analysis with transferable skills and learning paths | Simple diff algorithm |
| 5 | `mlRecommendResources` | Personalized resource scoring | Weighted formula |
| 6 | `mlGetAdaptiveIntervention` | ML intervention selection (8 types) | Hardcoded struggling→add resources |
| 7 | `mlPredictProgression` | Intelligent item unlocking | Single next-item unlock |
| 8 | `mlRecommendSkills` | ML skill recommendations with career impact analysis | Category-based suggestions |
| 9 | `mlEstimateCourseMeta` | Course difficulty and hours estimation | Keyword-based estimation |
| 10 | `mlGeneratePersonalizedTip` | Personalized daily learning tips | Date-hash deterministic selection |
| 11 | `mlScoreQuizPerformance` | Adaptive quiz scoring with Elo rating | Simple percentage scoring |
| 12 | `mlEstimateLearningVelocity` | ML-powered duration estimation | Fixed speed factor |

Caching strategy: 5 min (adaptation) → 1 hr (resources) → 6 hr (tips) → 24 hr (domain, course meta).

---

## Dashboard Panels

### Overview Tab

- **Welcome Banner** — Greeting with live streak counter (real DB data, not hardcoded)
- **Skill Summary** — User skills as colored proficiency badges (BEG/INT/ADV/EXP)
- **Radar Chart** — Skill distribution across categories (Recharts)
- **Quick Actions** — One-click access to roadmap, AI assistant, skill explorer
- **Pomodoro Timer** — 3-mode study timer with SVG progress ring and Web Audio API beep
- **Daily Tips** — AI-powered personalized learning tips with category badges
- **Weekly AI Summary** — LLM-generated weekly review with highlights
- **Activity Heatmap** — GitHub-style contribution graph
- **Goal Tracker** — Learning goals with deadlines, progress bars, and CRUD
- **Skill Recommendations** — ML-powered with match scores and personalized reasons

### Analytics Tab

- **Learning Analytics** — 6 metric cards + bar charts + category breakdowns
- **Achievements** — 12 achievement badges across 4 rarity tiers with glow effects
- **Leaderboard** — Top-3 podium + scrollable rankings + "Your Rank" gradient card

### Explore Skills Tab

- **Skill Explorer** — 82 skills, 9 categories, search input, proficiency selectors, animated progress bars

### Study Tools Tab

- **Flashcard Study Tool** — 36 cards, SM-2 algorithm, Deck/Flashcard/Quiz modes, keyboard shortcuts

### Skill Tree Tab

- **Interactive Graph** — 32+ nodes, Bézier curve edges, zoom/pan, minimap, search, focus mode, category filters

---

## API Routes

All routes accept/return JSON. Authentication is via `userId` query parameter (simplified for this prototype).

### Core

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth` | Sign up (201) or login (200). Password hashing, duplicate detection |
| GET/POST | `/api/profile` | Get or create/update learner profile + user skills |
| GET | `/api/skills` | List all skills. `?roles=true` for role-skill requirements |
| POST | `/api/onboarding` | Send onboarding message, get AI response, extract profile |
| POST/GET | `/api/roadmap` | Generate AI roadmap or fetch existing |
| POST | `/api/progress` | Update progress, trigger adaptive evaluation |
| GET/POST | `/api/chat` | Get chat history or send AI assistant message |
| GET/POST | `/api/assistant` | AI assistant conversations |

### Data

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/notes` | Learning journal CRUD |
| GET/POST/DELETE | `/api/study-sessions` | Study session logging |
| GET | `/api/analytics` | Real learning metrics from study sessions + progress |
| GET | `/api/activity` | Activity data for heatmap (30-day window) |
| GET | `/api/streak` | Streak calculation (current, longest, weekly, 30-day history) |
| GET | `/api/resources` | Resource library with user bookmarks |
| GET | `/api/skill-tree` | Skill graph data (nodes + edges + user proficiency) |
| GET | `/api/course-search` | ML-powered course difficulty/hours estimation |

### ML

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ml/recommendations` | ML skill recommendations with career impact |
| POST | `/api/ml/tips` | ML personalized daily tips |
| POST | `/api/ml/quiz-analysis` | ML adaptive quiz scoring with Elo rating |

### Content

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/quiz-questions` | Quiz question bank (auto-seeds if empty) |
| GET | `/api/flashcards` | Flashcard bank (auto-seeds if empty) |
| GET/POST | `/api/achievements` | Achievement tracking |
| GET/PATCH | `/api/notifications` | Notification management |
| GET/POST/PATCH/DELETE | `/api/learning-goals` | Full CRUD for learning goals |
| GET | `/api/weekly-summary` | AI-generated weekly learning summary |
| GET | `/api/health` | Health check + database connectivity diagnostics |

---

## Design System

### Color Palette

| Token | Light | Dark |
|-------|-------|------|
| Background | `#ffffff` | `#111318` |
| Card | `#f5f5f5` | `#1c1e26` |
| Border | `#e5e7eb` | `#374151` |
| Primary | `#1a1a2e` | `#e5e7eb` |
| Primary Foreground | `#ffffff` | `#1a1a2e` |

### Glassmorphism

```css
.glass-card {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.7);  /* light */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}
```

### Custom CSS (100+ Utility Classes)

The `globals.css` file (2,350+ lines) includes:

- **Glass utilities**: `.glass`, `.glass-card`, `.glass-sidebar`, `.glass-header`
- **Card depth system**: `.card-depth-1` through `.card-depth-3`
- **Gradient text**: `.text-gradient-emerald`, `.text-gradient-warm`, `.text-gradient-cool`
- **Animated borders**: `.gradient-border-animated` (rotating conic gradient)
- **Pulse effects**: `.pulse-glow-emerald`, `.animate-pulse-soft`
- **Shimmer loading**: `.shimmer-skeleton`
- **Entrance animations**: `.animate-float-in`, `.animate-bounce-in`
- **Hover effects**: `.hover-lift`, `.card-hover-lift`, `.glass-card-hover`
- **Premium buttons**: `.btn-premium` with gradient, glow, and lift
- **Scroll enhancements**: Custom 6px scrollbar, emerald-tinted
- **Focus rings**: Emerald glow on `focus-visible`
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables all animations
- **Print styles**: Clean roadmap PDF export with `break-inside: avoid` and A4 formatting

---

## Performance

### Dashboard Loading

| Optimization | Before | After |
|--------------|--------|-------|
| Time to interactive | 5-15 seconds | <100 milliseconds |
| Approach | Blocking spinner | Instant shell + progressive data |

Key optimizations:
- **Dynamic imports** — All 19 dashboard panels use `next/dynamic` with skeleton fallbacks
- **Module-level cache** — FluxBase client cached after first initialization
- **8s timeout wrapper** — `fetchWithTimeout()` prevents slow APIs from blocking the UI
- **Non-blocking session** — `isSessionRestored` set immediately; profile check runs in background with 6s timeout

### Roadmap Generation

| Metric | Before | After |
|--------|--------|-------|
| LLM calls | 21+ (one per skill) | 1 (compact structure only) |
| DB round-trips | 70+ sequential INSERTs | 3-5 batch INSERTs |
| Total time | 2-5+ minutes | ~30 seconds |

Key optimizations:
- **Compact AI prompt** — AI generates phases + skill names + topics only (no URLs)
- **TF-IDF resource matching** — Instant local keyword matching replaces per-skill LLM calls
- **Curated resource database** — 70+ verified URLs, zero hallucinated links
- **Batch DB inserts** — Chunks of 15-20 rows per query
- **In-memory response** — Response built from AI data directly, no follow-up query

### Codebase Stats

| Metric | Value |
|--------|-------|
| Total TypeScript files | 125 |
| Total TypeScript lines | ~29,250 |
| CSS lines | ~2,350 |
| React components | 37+ |
| API routes | 27 |
| Database tables | 16+ |
| Dashboard tabs | 9 |
| Dashboard panels | 19+ |
| shadcn/ui primitives | 40+ |
| Custom CSS classes | 100+ |
| Lucide icons used | 80+ |

---

## Security

- **Password hashing** — SHA-256 with unique salt, 1,000 iterations via Web Crypto API
- **Constant-time comparison** — Prevents timing attacks on password verification
- **Password hash isolation** — Never included in any API response
- **Input validation** — Email format, password strength, required fields on all endpoints
- **SQL injection prevention** — `escapeSql()` utility for all user-provided values in queries
- **Dynamic module imports** — Database module loaded inside try/catch to prevent crashes from exposing stack traces
- **Error boundary** — Graceful UI fallback prevents error details from reaching users
- **Timeout enforcement** — 15s on DB calls, 8s on frontend fetches, 120s on roadmap generation

---

## Demo Video Script

A comprehensive demo video script is available at [`DEMO-VIDEO-SCRIPT.md`](./DEMO-VIDEO-SCRIPT.md). It covers:

- 12 sections (~10 minutes total)
- Full narration text for each section
- Visual directions and camera cues
- On-screen text overlays and technical callouts
- Production notes (recording setup, audio, editing)
- Feature checklist with 50+ items

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with Next.js, TypeScript, and AI**

Made with passion for learners everywhere

</div>
