# AdaptiveLearn · AI-Powered Personalized Learning Path Recommender

> **SaaS Prototype — Fullstack Next.js + AWS Bedrock + Fluxbase**
> An AI-powered SaaS application that understands a learner's career goal and background knowledge, deterministically computes skill gaps using graph algorithms, generates sequentially ordered roadmaps (topological DAG sort), recommends multi-criteria scored resources, tracks verified mastery, and dynamically adapts future milestones based on continuous learner feedback.

---

## 🌟 What Makes This Architecture Defensible

| Traditional AI Roadmap Demo | AdaptiveLearn Production Architecture |
|---|---|
| Simple prompt asking GPT to generate random topics | **Deterministic Skill-Gap + Topological Sort DAG** engine in TypeScript; LLM used strictly for language tasks & explainability |
| Hallucinated or broken course links | **Curated Fluxbase Resource Store** scored via multi-criteria composite weights (Skill, Difficulty, Preference, Quality) |
| Static one-off output | **Continuous Adaptive Loop** that automatically injects prerequisite boosters or unlocks fast-tracks |
| Unbounded LLM costs | **CostGuard Token Budgeting** enforcing per-user monthly ceilings ($10/mo) with immutable audit logging |
| Generic mock UI | **State-of-the-Art Dark Glassmorphic Dashboard & Interactive DAG Timeline** built with Tailwind CSS |

---

## 🚀 Key Features

1. **Conversational AI Onboarding (`/onboarding`)**:
   - Multi-turn natural language dialogue extracting career objectives, prior experience, weekly hours, and learning style into validated schemas.
   - Real-time reactive learner profile drawer.

2. **Deterministic Skill-Gap & Prerequisite DAG Engine (`/lib/ai/`)**:
   - Compares user's extracted skills against canonical role matrices (AI Engineer, ML Engineer, Full Stack, DevOps, Data Science).
   - Kahn's algorithm topological sorting on skill prerequisites DAG with cycle detection.

3. **Interactive Roadmap DAG & Timeline (`/roadmap`)**:
   - Visual phase breakdown (Foundations, Core Engineering, Advanced Specialization, Capstone).
   - Prerequisite dependency tracking, milestone project deliverables, and time estimation.
   - Resource drawer showing composite score breakdown: `Skill (40%) + Difficulty (25%) + Preference (15%) + Quality (20%)`.

4. **Context-Grounded AI Learning Mentor (`/assistant`)**:
   - AI assistant powered by AWS Bedrock (`Claude 3.5 Sonnet`, `Claude 3 Haiku`, `Amazon Nova Pro`, `Amazon Titan`).
   - Grounded in live Fluxbase database state to eliminate hallucinations.

5. **Adaptive Learning Feedback Loop (`/api/roadmaps/adapt`)**:
   - Learner can submit feedback ("Struggling with concept", "Pacing too fast", "Already mastered").
   - Automatically recalibrates future phases while preserving past completed milestones.

6. **Interactive Skill Verification Micro-Quizzes (`/dashboard`)**:
   - Instant conceptual assessments that test and verify claimed skills with instant score feedback.

7. **AWS Bedrock Observability & CostGuard Console (`/settings`)**:
   - Real-time token usage tracker, latency measurements, and estimated USD spend per Bedrock invocation.
   - Live system health checks (`/healthz` and `/readyz`).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions, API Routes)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS, Glassmorphism, Micro-animations
- **LLM Provider**: AWS Bedrock Runtime (`@aws-sdk/client-bedrock-runtime`)
  - Anthropic Claude 3.5 Sonnet & Claude 3 Haiku
  - Amazon Nova Lite & Amazon Nova Pro
  - Amazon Titan Text Express
  - Meta Llama 3 70B
  - High-fidelity intelligent offline emulator fallback
- **Database / Data Store**: Fluxbase Store with pre-seeded role taxonomies & prerequisite graphs
- **Icons & Visuals**: Lucide React, Canvas Confetti

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration (Optional)
Copy `.env.example` to `.env.local` if you wish to connect your real AWS Bedrock credentials:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```
*(Note: If AWS credentials are omitted, the application runs seamlessly using the built-in Bedrock engine)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Structure

```text
├── app/
│   ├── layout.tsx                     # Root layout with Glassmorphism Navbar & theme
│   ├── page.tsx                       # High-impact Landing Page
│   ├── onboarding/page.tsx            # AI Conversational Onboarding & Live Extraction
│   ├── dashboard/page.tsx             # Progress Velocity, Skill Radar & Micro-Quizzes
│   ├── roadmap/page.tsx               # Interactive Roadmap DAG & Resource Drawer
│   ├── assistant/page.tsx             # Context-Grounded AI Learning Mentor
│   ├── settings/page.tsx              # AWS Bedrock Observability & CostGuard Monitor
│   └── api/
│       ├── onboarding/                # Chat dialogue & schema extraction
│       ├── roadmaps/                  # DAG generation, current roadmap & adaptation
│       ├── progress/                  # Milestone tracking & micro-quiz grading
│       ├── chat/                      # AI mentor tool execution
│       ├── observability/             # Token telemetry & spend logs
│       ├── healthz/ & readyz/         # Liveness & Readiness probes
├── components/
│   └── navbar.tsx                     # Top navigation with live Bedrock indicator
├── lib/
│   ├── aws/
│   │   ├── bedrock.ts                 # AWS Bedrock Runtime client & fallback engine
│   │   └── models.ts                  # Bedrock model catalog & token pricing
│   ├── db/
│   │   ├── fluxbase.ts                # Fluxbase store & client repository
│   │   ├── schema.ts                  # TypeScript interfaces for all DB entities
│   │   └── seed.ts                    # Curated career roles, skills & resources
│   ├── ai/
│   │   ├── orchestrator.ts            # Main learning path orchestrator
│   │   ├── goal_analyzer.ts           # Bedrock profile extraction
│   │   ├── skill_gap.ts               # Deterministic skill gap analyzer
│   │   ├── prerequisites.ts           # Kahn's topological sort on DAG
│   │   ├── recommendation.ts          # Multi-criteria scoring engine
│   │   ├── adaptation_engine.ts       # Dynamic roadmap adaptation
│   │   └── cost_guard.ts              # Token budget & rate limit enforcement
│   └── utils.ts                       # UI styling & helper utilities
```
