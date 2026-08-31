# Study Buddies — Demo Video Script

> **Estimated Duration:** 8–10 minutes
> **Style:** Screen recording with voiceover narration
> **Pacing:** Moderate — pause on key moments for visual impact

---

## Table of Contents

1. [Opening & Hook](#1-opening--hook) — 0:00–0:30
2. [Landing Page Walkthrough](#2-landing-page-walkthrough) — 0:30–1:30
3. [Authentication & Security](#3-authentication--security) — 1:30–2:15
4. [AI Onboarding Experience](#4-ai-onboarding-experience) — 2:15–3:30
5. [Dashboard Overview](#5-dashboard-overview) — 3:30–5:00
6. [AI Roadmap Generation](#6-ai-roadmap-generation) — 5:00–6:00
7. [Roadmap View & Resources](#7-roadmap-view--resources) — 6:00–6:45
8. [Study Tools](#8-study-tools) — 6:45–7:45
9. [AI Learning Assistant](#9-ai-learning-assistant) — 7:45–8:15
10. [Profile & Achievements](#10-profile--achievements) — 8:15–8:45
11. [Technical Architecture Deep Dive](#11-technical-architecture-deep-dive) — 8:45–9:30
12. [Closing & CTA](#12-closing--cta) — 9:30–10:00

---

## 1. Opening & Hook

**[0:00–0:30]**

**Visual:** Fade in from black. The Study Buddies logo appears centered, then the full landing page reveals itself with the particle constellation canvas animating in the background.

**Narration:**

> "What if you had an AI-powered study partner that understood your goals, built a personalized learning roadmap, tracked your progress, and adapted to your pace — all in one beautiful, modern application?

> Meet **Study Buddies** — a full-stack AI learning platform that transforms how developers and tech professionals plan, track, and accelerate their learning journeys.

> In the next few minutes, I'll walk you through every feature, every interaction, and the technical architecture that makes it all work."

**On-screen Text Overlay:**
```
Study Buddies
AI-Powered Personalized Learning Platform
```

---

## 2. Landing Page Walkthrough

**[0:30–1:30]**

**Visual:** Slow scroll down the landing page, pausing at each section.

### 2a. Hero Section

**Visual:** Hero with animated particle constellation canvas. Mouse moves slightly to show the mouse-repulsion effect on particles. Title text and CTA buttons are visible.

**Narration:**

> "We start at the landing page. Right away you'll notice this isn't a generic template — there's a live particle constellation canvas with 55 animated particles that react to your mouse cursor, connected by proximity lines. It creates a living, breathing background.

> The hero section features a bold headline, a clear value proposition, and two call-to-action buttons to get started immediately."

### 2b. Animated Stats Counter

**Visual:** Scroll to the stats section with the grid pattern background. The animated counters (10,000+ Learners, 500+ Learning Paths, 60+ Skills, 95% Satisfaction) count up as they enter the viewport.

**Narration:**

> "As you scroll, these stat counters animate into view using an IntersectionObserver — they only start counting when they actually appear on screen. Each has an icon with an animated gradient background and a hover tooltip for more context."

### 2c. Feature Cards

**Visual:** Scroll through the 6 feature cards. Hover over one to show the animated gradient border overlay and the sweep effect.

**Narration:**

> "The features section showcases the six core capabilities of the platform. Each card has an animated gradient border on hover, a sweep overlay effect, and a sliding arrow indicator. The design uses a glassmorphism card system — frosted glass with backdrop blur — that runs consistently throughout the entire app."

### 2d. How It Works

**Visual:** Scroll to the 4-step 'How It Works' section. Each circular node has a gradient border and pulsing ring animation. They reveal sequentially as you scroll.

**Narration:**

> "The 'How It Works' section explains the flow in four steps: Tell us your goals, AI analyzes your skills, Get your personalized roadmap, and Track your progress. Each node animates sequentially with a pulsing ring effect as they enter the viewport."

### 2e. Testimonials & FAQ

**Visual:** Scroll through testimonials (auto-rotating carousel on mobile, grid on desktop) and the FAQ accordion section.

**Narration:**

> "Testimonials use a carousel on mobile with smooth slide transitions. On desktop, they display as a grid. The FAQ section is built with an accessible Accordion component — click to expand, hover for highlights."

### 2f. Final CTA

**Visual:** Scroll to the final CTA with the mesh gradient background, floating animated decorative icons, and the rotating conic-gradient border on the button.

**Narration:**

> "And at the bottom, a mesh gradient call-to-action with floating icons and an animated rotating-gradient border on the button. Every pixel is intentional."

---

## 3. Authentication & Security

**[1:30–2:15]**

**Visual:** Click 'Get Started' → Auth page appears. Show both Sign Up and Login tabs.

**Narration:**

> "Clicking 'Get Started' brings us to the authentication page. This uses email and password — no social login complexity.

> On sign-up, you'll notice a real-time password strength indicator with animated checkboxes. It requires at least 8 characters, an uppercase letter, a lowercase letter, and a number. The submit button stays disabled until all requirements are met.

> There's a show/hide password toggle for convenience.

> On the backend, passwords are hashed using the Web Crypto API — SHA-256 with a unique salt and 1,000 iterations. Comparison is constant-time to prevent timing attacks. The password hash is never included in any API response."

**Technical Callout (on-screen text):**
```
🔐 Security:
• SHA-256 + Salt (1000 iterations)
• Web Crypto API (native browser)
• Constant-time comparison
• Password hash never in API responses
• Input validation (email format, strength rules)
```

---

## 4. AI Onboarding Experience

**[2:15–3:30]**

**Visual:** After sign-up, the onboarding chat screen appears. Show the welcome animation (sparkle particles, animated logo, gradient title). Type a response or click a quick reply. Show the progress stepper advancing.

**Narration:**

> "After creating your account, you're greeted by an AI onboarding chat — this is where the magic begins.

> First, there's a beautiful welcome animation with sparkle particles and a spring-animated logo. The AI introduces itself and asks about your learning goals.

> Look at the progress stepper at the top — it tracks 5 stages: Welcome, Goals, Skills, Experience, and Complete. Each stage has an icon, animated connector lines, and a pulsing indicator on the active step.

> The AI messages appear in glassmorphism bubbles with a Brain icon avatar and an emerald accent border. User messages use a gradient background. There's even a CSS-animated typing indicator with bouncing dots when the AI is 'thinking.'

> Under each AI message, you'll see quick reply suggestion pills — these change based on the current onboarding step, making it easy to guide the conversation.

> The AI uses the z-ai-web-dev-sdk to process your responses, extracts your target role, current skills, and experience level, then constructs a complete learner profile — all through natural conversation."

**Technical Callout (on-screen text):**
```
🧠 AI Onboarding:
• LLM-powered via z-ai-web-dev-sdk
• 5-stage conversational flow
• Quick reply suggestions per stage
• Progress stepper with animations
• Glassmorphism chat bubbles
• Profile extraction from conversation
```

---

## 5. Dashboard Overview

**[3:30–5:00]**

**Visual:** After onboarding completes (or navigating from header), the dashboard loads. Pan across the full dashboard layout. Click through multiple tabs to show breadth.

### 5a. Instant Loading

**Narration:**

> "The dashboard is the heart of the application — and it loads instantly. No blocking spinners. All 19 sub-panels use Next.js dynamic imports with skeleton loading fallbacks. The FluxBase database client is cached at the module level after the first initialization. Every API call has an 8-second timeout wrapper. The result? The dashboard shell renders in under 100 milliseconds."

### 5b. Overview Tab

**Visual:** Show the welcome banner with streak indicator, skill summary badges, radar chart, quick actions, and pomodoro timer.

**Narration:**

> "The Overview tab shows your welcome banner with a live streak counter — this tracks actual learning consistency from the database, not a hardcoded number. Below that, your current skills are shown as colored badges with proficiency level indicators.

> The radar chart visualizes your skill distribution across categories. The quick actions panel gives you one-click access to generate a roadmap, start the AI assistant, or explore skills.

> And here's the Pomodoro Timer — a full-featured study timer with three modes: Focus at 25 minutes, Short Break at 5 minutes, and Long Break at 15 minutes. It has an SVG circular progress ring with gradient strokes, audio beep on completion via the Web Audio API, and session tracking with a 4-session Pomodoro cycle."

### 5c. Daily Tips & Weekly Summary

**Visual:** Scroll to the Daily Tips panel and Weekly AI Summary card.

**Narration:**

> "The Daily Learning Tip is now AI-powered — it uses the ML engine to generate personalized tips based on your actual learning context, not just a random date hash. Each tip has a category badge and expandable previous tips.

> The AI Weekly Insight card fetches a personalized summary from the backend — it analyzes your progress data, roadmap status, and chat history to generate a weekly review with highlights."

### 5d. Goal Tracker

**Visual:** Show the Goal Tracker panel with existing goals and the 'Add Goal' dialog.

**Narration:**

> "The Learning Goals panel lets you set targets with deadlines. Each goal has a category, a progress slider, and a deadline with color-coded urgency indicators — red for less than 3 days, amber for less than 7. Goals are fully persisted to the database with full CRUD operations."

### 5e. Other Dashboard Tabs (Quick Montage)

**Visual:** Rapid-click through the remaining tabs: Analytics, Explore Skills, Resources & Goals, Activity, Study Tools, Skill Tree, Community, Challenges.

**Narration:**

> "The dashboard has **9 tabs** in total — let me give you a quick tour:

> - **Analytics** — Learning metrics with bar charts, category breakdowns, achievements with rarity tiers (Common, Great, Rare, Legendary), and a community leaderboard with podium.
> - **Explore Skills** — Browse 82 skills across 9 categories with search, filter, and interactive proficiency selectors.
> - **Resources & Goals** — A full resource library with bookmarking, plus the goal tracker.
> - **Activity** — A GitHub-style activity heatmap showing your learning consistency, a study session logger, and AI-powered skill recommendations with match scores.
> - **Study Tools** — This is a big one, we'll dive deeper shortly.
> - **Skill Tree** — An interactive graph visualization with 32+ nodes, zoom, pan, and a minimap.
> - **Community** — Real activity feed and leaderboard computed from actual user data.
> - **Challenges** — Streak calendar with milestone badges and quiz challenges."

---

## 6. AI Roadmap Generation

**[5:00–6:00]**

**Visual:** Click 'Generate Roadmap' from the dashboard or onboarding. Show the animated generation progress screen with step indicators. Wait for completion, then show the success toast.

**Narration:**

> "Now for the star feature — AI Roadmap Generation.

> When you click 'Generate Roadmap,' the AI takes your learner profile and target goal, then generates a completely personalized, multi-phase learning path.

> During generation, you see this beautiful animated progress screen with step indicators showing what's happening: the AI is analyzing your profile, generating the phase structure, matching resources, and saving to the database.

> Here's what happens under the hood:
1. The AI generates a compact structure — 4 to 5 phases with 3 skills each. We intentionally keep the LLM prompt small so it responds fast.
2. A curated database of 70+ real learning resources from platforms like freeCodeCamp, YouTube, MIT OCW, Coursera, and Khan Academy is matched to each skill using TF-IDF keyword scoring. Zero hallucinated URLs.
3. Everything is persisted to the database using batch inserts — chunked writes of 15-20 rows at a time instead of 70+ sequential queries.
4. The entire process completes in about 30 seconds.

> The result? A fully personalized roadmap with goal-specific skills and real, verified resource links."

**Technical Callout (on-screen text):**
```
🗺️ Roadmap Generation Pipeline:
1. AI generates phase structure (1 LLM call)
2. TF-IDF resource matching (0ms per skill)
3. Batch DB inserts (3-5 queries, not 70+)
4. Total: ~30 seconds

📚 Resource Database:
• 70+ curated, verified resources
• 17 learning domains
• Sources: freeCodeCamp, YouTube, MIT OCW,
  Coursera, Khan Academy, MDN, Kaggle
```

---

## 7. Roadmap View & Resources

**[6:00–6:45]**

**Visual:** Navigate to the Roadmap view. Show the phase timeline with connected nodes. Expand a phase to show items. Expand an item to show resources. Click a resource card to open it.

**Narration:**

> "The Roadmap view presents your learning path as a vertical timeline with connected phase nodes. Each phase shows its name, estimated hours, and week count.

> Expanding a phase reveals the individual skills and milestones. Completed items get a green accent and checkmark.

> Each skill item can be expanded to show its assigned resources — and these are real, clickable links. Each resource card shows the type with a color-coded badge — green for courses, blue for videos, amber for articles, violet for tutorials. Clicking any resource opens it in a new tab.

> You can also export your entire roadmap as a PDF using the built-in PDF export feature — it generates a print-optimized view with clean formatting."

---

## 8. Study Tools

**[6:45–7:45]**

**Visual:** Navigate to the 'Study Tools' dashboard tab.

### 8a. Flashcard Study Tool

**Narration:**

> "The Flashcard Study Tool is a full-featured spaced repetition system. It comes with 36 flashcards across 6 categories, and three study modes:

> **Deck Mode** lets you browse, filter by category, and sort cards.

> **Flashcard Mode** uses the SM-2 spaced repetition algorithm — the same algorithm used by Anki. Each card has a 3D flip animation. After seeing the answer, you rate your recall: Again, Hard, Good, or Easy. Each rating adjusts the card's ease factor and interval. Cards you struggle with appear more frequently.

> **Quiz Mode** turns flashcards into multiple-choice questions with auto-scoring and a results screen.

> Keyboard shortcuts are supported throughout — Space to flip, 1-4 to rate, arrow keys to navigate."

### 8b. Quiz Challenge Panel

**Visual:** Switch to the Challenges tab and show the Quiz Challenge.

**Narration:**

> "The Quiz Challenge panel pulls real questions from the database and uses ML-powered adaptive scoring. It tracks your performance and adjusts difficulty based on your answers using an Elo rating system."

---

## 9. AI Learning Assistant

**[7:45–8:15]**

**Visual:** Click 'AI Assistant' from the header navigation. Show the chat interface. Type a question and show the AI response with typing indicator.

**Narration:**

> "The AI Learning Assistant is your always-available study buddy. Click the Assistant tab in the navigation to open it.

> It's a full chat interface powered by LLM via the z-ai-web-dev-sdk on the backend. You can ask questions about your learning path, get explanations for concepts, request study strategies, or ask for help with specific skills.

> The assistant has context about your profile, roadmap, and progress — so its responses are actually personalized, not generic. Chat history is persisted to the database so you can continue conversations across sessions.

> The typing indicator, smooth auto-scroll, and message animations make it feel like chatting with a real tutor."

---

## 10. Profile & Achievements

**[8:15–8:45]**

**Visual:** Navigate to the Profile view. Show the cover banner, avatar, stats cards, activity heatmap, skill proficiency bars, achievement showcase, and preferences panel.

**Narration:**

> "The Profile page has been designed to feel like a professional portfolio. There's a large cover banner with your avatar overlapping it, surrounded by an emerald ring.

> Four animated stats cards show your total skills, learning streak, completed items, and total study hours — each with animated counters.

> The Activity Heatmap — the same GitHub-style contribution graph — is integrated here too. Below it, your skills are displayed with animated proficiency bars that fill on mount with staggered delays.

> The Achievement Showcase features your top earned achievements with rarity glow effects — Common, Great, Rare, and Legendary tiers, each with its own distinct visual treatment.

> There's even a Learning Journey Timeline showing your recent activities, and a Preferences panel where you can toggle between light and dark themes, set a daily learning goal, and configure notification preferences.

> And yes — you can click the pencil icon to edit your name inline."

---

## 11. Technical Architecture Deep Dive

**[8:45–9:30]**

**Visual:** Transition to a code/architecture diagram overlay (or split-screen with code). Show key files, the API route structure, and data flow.

**Narration:**

> "Let me pull back the curtain on the technical architecture.

> **Study Buddies** is built on a modern, production-ready stack:

> **Frontend:** Next.js 16 with the App Router, React 19, TypeScript 5, and Tailwind CSS 4. The UI is built entirely with shadcn/ui components — over 40 Radix UI primitives — styled with a custom glassmorphism design system. Animations are handled by Framer Motion with over 100 custom CSS utility classes.

> **State Management:** Zustand manages client state with localStorage persistence for session recovery. TanStack Query handles server state caching.

> **Backend:** 24 API routes covering auth, profile, skills, onboarding, roadmap, progress, chat, assistant, notes, study sessions, analytics, achievements, notifications, learning goals, flashcards, quiz questions, skill tree, course search, streak tracking, activity, weekly summaries, ML recommendations, ML tips, and ML quiz analysis.

> **Database:** FluxBase — a cloud-hosted PostgreSQL service accessed via REST API. The schema has 16+ tables including users, learner profiles, skills, prerequisites, roadmaps, progress tracking, resources, notes, study sessions, achievements, notifications, goals, and more. All data is dynamically imported via a safe wrapper that catches module-level crashes — critical for serverless deployment.

> **AI/ML Engine:** The z-ai-web-dev-sdk powers all LLM calls — onboarding chat, roadmap generation, AI assistant, and weekly summaries. On top of that, there's a custom ML engine with 12 functions that replaced 27 rule-based features: adaptive learning evaluation, semantic resource matching, intelligent progression prediction, personalized skill recommendations, Elo-rated quiz scoring, and more. Every ML function has a deterministic fallback for resilience.

> **Performance:** The dashboard uses next/dynamic for all 19 sub-panels, eliminating a 5-15 second load time down to under 100 milliseconds. API calls use 8-second timeouts and the FluxBase client is cached at the module level. Roadmap generation was optimized from 2-5 minutes down to 30 seconds by reducing LLM calls from 21 to 1 and using batch DB inserts.

> **Reliability:** An Error Boundary wraps the entire app for graceful failure recovery. The useIsMounted hook prevents hydration mismatches on serverless platforms. Password hashing uses the Web Crypto API with constant-time comparison."

**On-screen Architecture Diagram:**
```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js 16 │ React 19 │ TypeScript 5           │
│  Tailwind CSS 4 │ shadcn/ui │ Framer Motion     │
│  Zustand (state) │ TanStack Query (cache)        │
├─────────────────────────────────────────────────┤
│              24 API Routes                       │
│  Auth │ Profile │ Onboarding │ Roadmap │ Chat    │
│  Progress │ Notes │ Analytics │ ML │ ...         │
├─────────────────────────────────────────────────┤
│                Backend Services                  │
│  z-ai-web-dev-sdk (LLM) │ ML Engine (12 funcs) │
│  FluxBase Client (cached) │ Password (Web Crypto)│
├─────────────────────────────────────────────────┤
│               Database Layer                     │
│  FluxBase PostgreSQL (16+ tables)                │
│  70+ curated resources │ Batch operations        │
└─────────────────────────────────────────────────┘
```

**Key Stats (on-screen text):**
```
📊 By The Numbers:
• 37+ React components
• 24 API routes
• 16+ database tables
• 9 dashboard tabs
• 19 dashboard panels
• 12 ML functions
• 70+ curated learning resources
• 82 skills across 9 categories
• 36 flashcards with SM-2 algorithm
• 40 quiz questions
• 100+ custom CSS classes
• ~25,000+ lines of TypeScript
```

---

## 12. Closing & CTA

**[9:30–10:00]**

**Visual:** Final montage of the best UI moments — particle canvas, onboarding animation, roadmap timeline, flashcard flip, profile achievement glow. End with the Study Buddies logo centered on a clean background.

**Narration:**

> "So that's Study Buddies — an AI-powered learning platform that combines conversational AI onboarding, personalized roadmap generation, adaptive study tools, spaced repetition, community features, and a beautiful glassmorphism UI.

> It's built with a production-grade tech stack — Next.js 16, TypeScript, PostgreSQL, and a custom ML engine — designed to be fast, reliable, and genuinely useful for anyone serious about leveling up their tech skills.

> Every feature you saw is functional end-to-end, backed by real database operations, real AI calls, and real learning science.

> Thanks for watching."

**Final Screen:**
```
Study Buddies

Built with Next.js 16, TypeScript 5, Tailwind CSS 4
AI Powered by z-ai-web-dev-sdk

❤️ & Code
```

---

## Production Notes

### Screen Recording Setup
- **Resolution:** 1920x1080 minimum
- **Browser:** Chrome/Edge with dev tools closed
- **OS UI:** Hide dock/taskbar, use clean desktop
- **Cursor:** Show cursor clicks with a yellow circle overlay
- **Scrolling:** Smooth, deliberate 2-3 second pauses per section

### Audio
- **Mic:** Quality USB condenser mic
- **Environment:** Quiet room, no echo
- **Pacing:** Speak slowly, pause 1-2 seconds between sections
- **Tone:** Enthusiastic but professional, like a product demo at a conference

### Editing
- **Zoom-ins:** Use Ken Burns effect on UI details (typing indicator, progress stepper, flashcard flip)
- **Transitions:** 0.3s cross-fade between sections
- **Text overlays:** Fade in/out, 2-3 second display time
- **Code/architecture diagrams:** Animate build-up (lines appear sequentially)
- **Stats numbers:** Animate counting up to match the app's own counter animation
- **Background music:** Subtle lo-fi or ambient tech music at low volume (optional)

### Key Moments to Emphasize
1. **Particle canvas mouse interaction** — shows it's not a static background
2. **Password strength indicator** — shows attention to security UX
3. **AI onboarding typing indicator + quick replies** — shows AI is "thinking"
4. **Dashboard instant load** — contrast with typical loading spinners
5. **Roadmap generation progress screen** — shows transparency into AI process
6. **Flashcard 3D flip** — most visually impressive micro-interaction
7. **Achievement rarity glow** — shows gamification depth
8. **Profile inline editing** — shows polish and attention to detail

---

## Feature Checklist (for reference during recording)

### Landing Page
- [ ] Particle canvas with mouse repulsion
- [ ] Animated stat counters (IntersectionObserver)
- [ ] Feature cards with gradient border hover
- [ ] How It Works sequential reveal
- [ ] Testimonial carousel (mobile) / grid (desktop)
- [ ] FAQ accordion
- [ ] Mesh gradient CTA with floating icons

### Authentication
- [ ] Sign up with name, email, password
- [ ] Password strength indicator (4 requirements)
- [ ] Show/hide password toggle
- [ ] Login tab switching
- [ ] Error handling (inline banner)

### Onboarding
- [ ] Welcome animation (sparkles, logo, gradient text)
- [ ] AI chat with glassmorphism bubbles
- [ ] Typing indicator (bouncing dots)
- [ ] Progress stepper (5 stages)
- [ ] Quick reply suggestion pills
- [ ] Smooth auto-scroll

### Dashboard (9 tabs)
- [ ] Overview: Welcome banner, streak, skill badges, radar chart
- [ ] Overview: Pomodoro timer (3 modes, progress ring, audio beep)
- [ ] Overview: Daily AI tips, weekly summary
- [ ] Overview: Goal tracker with CRUD
- [ ] Analytics: Learning metrics (bar charts, category bars)
- [ ] Analytics: Achievements (12 badges, 4 rarity tiers)
- [ ] Analytics: Leaderboard (podium, rankings, "Your Rank" card)
- [ ] Explore Skills: 82 skills, 9 categories, search, filter
- [ ] Resources & Goals: Resource library, goal tracker
- [ ] Activity: Heatmap, study session logger, skill recommendations
- [ ] Study Tools: Flashcard study tool (3 modes, SM-2, keyboard shortcuts)
- [ ] Skill Tree: Interactive graph (zoom, pan, minimap, 32 nodes)
- [ ] Community: Activity feed, leaderboard
- [ ] Challenges: Streak calendar, quiz challenge

### Roadmap
- [ ] Phase timeline with connected nodes
- [ ] Expandable phases and items
- [ ] Resource cards with type badges (clickable links)
- [ ] PDF export
- [ ] Progress tracking

### AI Assistant
- [ ] Chat interface with typing indicator
- [ ] Context-aware responses
- [ ] Persistent chat history

### Profile
- [ ] Cover banner with avatar
- [ ] 4 animated stat cards
- [ ] Activity heatmap
- [ ] Skill proficiency bars
- [ ] Achievement showcase (rarity glow)
- [ ] Learning journey timeline
- [ ] Preferences (theme, daily goal, notifications)
- [ ] Inline name editing

### System Features
- [ ] Dark/light mode toggle
- [ ] Notifications panel (bell icon, unread badge)
- [ ] Keyboard shortcuts
- [ ] Sticky footer
- [ ] Responsive design (mobile + desktop)
- [ ] Session persistence (localStorage)
- [ ] Error boundary
