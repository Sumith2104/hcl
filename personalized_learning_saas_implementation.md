# AI-Powered Personalized Learning Path Recommender

## SaaS Prototype --- Implementation Plan

> **Prototype Goal:** Build an AI-powered SaaS application that
> understands a learner's goal and current knowledge, identifies skill
> gaps, generates a personalized learning roadmap, recommends learning
> resources, tracks progress, and adapts future recommendations.

------------------------------------------------------------------------

# 1. Product Scope

## 1.1 Core User Flow

``` text
User Signup
    ↓
AI Onboarding Conversation
    ↓
Learner Profile Created
    ↓
Goal + Current Skills Extracted
    ↓
Skill Gap Analysis
    ↓
Personalized Learning Roadmap Generated
    ↓
Resources + Projects Recommended
    ↓
User Tracks Progress
    ↓
AI Adapts Roadmap
```

## 1.2 MVP Features

The first prototype should contain:

1.  User authentication
2.  AI conversational onboarding
3.  Learner profile creation
4.  Goal and skill extraction
5.  Skill gap analysis
6.  Personalized roadmap generation
7.  Resource recommendations
8.  Progress tracking dashboard
9.  AI learning assistant
10. Adaptive roadmap updates

------------------------------------------------------------------------

# 2. Recommended Tech Stack

## Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query

## Backend

-   Python
-   FastAPI
-   Pydantic
-   SQLAlchemy

## AI Layer

-   LLM API
-   Structured JSON output
-   Embeddings
-   LangGraph or a lightweight custom orchestration layer

## Database

-   PostgreSQL
-   pgvector

## Authentication

For prototype:

-   Clerk, Auth0, or Supabase Auth

Recommended simple stack:

``` text
Next.js + FastAPI + PostgreSQL + pgvector + LLM API
```

------------------------------------------------------------------------

# 3. System Architecture

``` text
┌─────────────────────────────────────────────┐
│                 FRONTEND                    │
│                  Next.js                    │
│                                             │
│ Landing │ Auth │ Onboarding │ Dashboard     │
│ Roadmap │ Chat │ Progress │ Profile         │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTPS / REST API
                       ▼
┌─────────────────────────────────────────────┐
│                  BACKEND                    │
│                  FastAPI                    │
│                                             │
│ Auth │ Profile │ Roadmap │ Progress │ Chat  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              AI ORCHESTRATOR                │
│                                             │
│ Goal Analyzer                               │
│ Skill Normalizer                            │
│ Skill Gap Engine                            │
│ Roadmap Generator                           │
│ Recommendation Engine                       │
│ Adaptation Engine                           │
└───────────────┬────────────────┬────────────┘
                │                │
                ▼                ▼
         ┌─────────────┐   ┌───────────────┐
         │   LLM API   │   │   pgvector    │
         └─────────────┘   └───────────────┘
                │                │
                └────────┬───────┘
                         ▼
                 ┌───────────────┐
                 │  PostgreSQL   │
                 │               │
                 │ Users         │
                 │ Skills        │
                 │ Resources     │
                 │ Roadmaps      │
                 │ Progress      │
                 └───────────────┘
```

------------------------------------------------------------------------

# 4. Repository Structure

``` text
personalized-learning-saas/
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── roadmap/
│   │   ├── chat/
│   │   └── profile/
│   │
│   ├── components/
│   │   ├── chat/
│   │   ├── roadmap/
│   │   ├── dashboard/
│   │   └── ui/
│   │
│   ├── lib/
│   │   └── api.ts
│   │
│   └── types/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── profile.py
│   │   │   ├── roadmap.py
│   │   │   ├── progress.py
│   │   │   └── chat.py
│   │   │
│   │   ├── services/
│   │   │   ├── profile_service.py
│   │   │   ├── roadmap_service.py
│   │   │   └── progress_service.py
│   │   │
│   │   ├── ai/
│   │   │   ├── orchestrator.py
│   │   │   ├── goal_analyzer.py
│   │   │   ├── skill_normalizer.py
│   │   │   ├── skill_gap.py
│   │   │   ├── roadmap_generator.py
│   │   │   ├── recommendation_engine.py
│   │   │   └── adaptation_engine.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── skill.py
│   │   │   ├── roadmap.py
│   │   │   └── resource.py
│   │   │
│   │   ├── schemas/
│   │   └── database/
│   │
│   └── requirements.txt
│
├── docs/
└── README.md
```

------------------------------------------------------------------------

# 5. Database Design

## users

``` text
id
name
email
created_at
```

## learner_profiles

``` text
id
user_id
target_goal
experience_level
available_hours_per_week
preferred_learning_style
interests
target_duration
```

## skills

``` text
id
name
category
description
```

## user_skills

``` text
id
user_id
skill_id
proficiency_level
confidence_score
verified
```

Suggested proficiency:

``` text
beginner
intermediate
advanced
expert
```

## skill_prerequisites

This creates the skill dependency graph.

``` text
id
skill_id
prerequisite_skill_id
importance
```

Example:

``` text
Machine Learning
    requires
        ├── Python
        ├── Statistics
        └── Linear Algebra
```

## role_skill_requirements

``` text
id
target_role
skill_id
required_level
importance
```

Example:

``` text
Machine Learning Engineer
    ├── Python
    ├── Statistics
    ├── Machine Learning
    ├── Deep Learning
    ├── MLOps
    └── Deployment
```

## resources

``` text
id
title
description
url
type
difficulty
estimated_hours
quality_score
embedding
```

## resource_skills

``` text
resource_id
skill_id
```

## roadmaps

``` text
id
user_id
target_goal
estimated_duration_weeks
status
created_at
```

## roadmap_items

``` text
id
roadmap_id
skill_id
sequence_order
phase
estimated_hours
status
```

## roadmap_resources

``` text
roadmap_item_id
resource_id
recommendation_reason
```

## progress

``` text
id
user_id
roadmap_item_id
completion_percentage
assessment_score
feedback
updated_at
```

------------------------------------------------------------------------

# 6. AI Implementation

## 6.1 AI Orchestrator

The AI layer should not directly generate everything in one prompt.

Use a pipeline:

``` text
User Input
    ↓
Goal Extraction
    ↓
Skill Normalization
    ↓
Load User Profile
    ↓
Find Target Role Requirements
    ↓
Skill Gap Analysis
    ↓
Order Skills by Prerequisites
    ↓
Generate Roadmap
    ↓
Retrieve Matching Resources
    ↓
LLM Personalizes Explanation
```

The orchestrator coordinates these modules.

``` python
class LearningOrchestrator:

    async def create_learning_path(self, user_input, user_id):

        profile = await goal_analyzer.analyze(user_input)

        normalized_skills = await skill_normalizer.normalize(
            profile.current_skills
        )

        skill_gaps = skill_gap_engine.find_gaps(
            normalized_skills,
            profile.target_goal
        )

        ordered_skills = prerequisite_engine.order(skill_gaps)

        roadmap = await roadmap_generator.generate(
            profile,
            ordered_skills
        )

        return roadmap
```

------------------------------------------------------------------------

# 7. AI Conversational Onboarding

## Purpose

The AI should collect information naturally instead of showing a large
form.

Example:

``` text
AI: What do you want to learn or become?

User: I want to become an ML Engineer.

AI: Great. What experience do you already have with Python and ML?

User: I know Python and basic machine learning.

AI: How much time can you dedicate every week?

User: Around 15 hours.

AI: Do you have a target deadline?

User: 4 months.
```

The system stores the conversation and periodically extracts structured
information.

## Profile Extraction Output

``` json
{
  "target_goal": "Machine Learning Engineer",
  "current_skills": [
    {
      "skill": "Python",
      "level": "intermediate"
    },
    {
      "skill": "Machine Learning",
      "level": "beginner"
    }
  ],
  "available_hours_per_week": 15,
  "target_duration_weeks": 16,
  "interests": [
    "Machine Learning"
  ]
}
```

Use Pydantic validation before storing this data.

------------------------------------------------------------------------

# 8. Skill Normalization

Users may describe the same skill differently.

Example:

``` text
"ML"
"Machine Learning"
"Machine learning algorithms"
```

All should map to:

``` text
Machine Learning
```

Implementation:

``` text
User Skill
    ↓
Embedding Generation
    ↓
Vector Search Against Skills Table
    ↓
Similarity Score
    ↓
Canonical Skill ID
```

If similarity is low:

``` text
LLM Classifier
    ↓
Existing Skill Match
    OR
Create Review Candidate
```

Do not create duplicate skills automatically in the MVP.

------------------------------------------------------------------------

# 9. Skill Gap Analysis

## Input

``` text
User Skills:
Python
Basic Machine Learning

Target:
Machine Learning Engineer
```

## Required Skills

``` text
Python
Statistics
Machine Learning
Deep Learning
MLOps
Deployment
```

## Output

``` text
Known:
✓ Python
✓ Machine Learning

Missing:
✗ Statistics
✗ Deep Learning
✗ MLOps
✗ Deployment
```

## Implementation Logic

``` python
def find_skill_gaps(user_skills, required_skills):
    gaps = []

    for required_skill in required_skills:
        if not user_has_required_level(
            user_skills,
            required_skill
        ):
            gaps.append(required_skill)

    return gaps
```

For the prototype, use deterministic database logic rather than asking
the LLM to calculate the gaps.

------------------------------------------------------------------------

# 10. Prerequisite Ordering

The roadmap should follow a dependency graph.

Example:

``` text
Statistics
     ↓
Machine Learning
     ↓
Deep Learning
     ↓
MLOps
```

Implementation options:

1.  Directed graph
2.  Topological sorting
3.  Database dependency table

Use topological sorting to order skills.

Pseudo-implementation:

``` python
import networkx as nx

graph = nx.DiGraph()

graph.add_edge("Python", "Machine Learning")
graph.add_edge("Statistics", "Machine Learning")
graph.add_edge("Machine Learning", "Deep Learning")

ordered_skills = list(nx.topological_sort(graph))
```

For production, validate that the skill graph contains no circular
dependencies.

------------------------------------------------------------------------

# 11. Roadmap Generation

## Input

``` json
{
  "target_role": "Machine Learning Engineer",
  "skill_gaps": [
    "Statistics",
    "Deep Learning",
    "MLOps"
  ],
  "available_hours_per_week": 15,
  "duration_weeks": 16
}
```

## Process

``` text
Calculate Total Available Hours
             ↓
Prioritize Important Skills
             ↓
Order Prerequisites
             ↓
Allocate Time
             ↓
Create Phases
             ↓
Generate Milestones
             ↓
Assign Projects
```

## Example Output

``` json
{
  "roadmap": [
    {
      "phase": 1,
      "title": "Statistics Foundations",
      "duration_weeks": 3,
      "skills": [
        "Probability",
        "Descriptive Statistics",
        "Hypothesis Testing"
      ],
      "milestone": "Complete 3 practice exercises"
    },
    {
      "phase": 2,
      "title": "Deep Learning",
      "duration_weeks": 5,
      "skills": [
        "Neural Networks",
        "CNN",
        "Transformers"
      ],
      "milestone": "Build an image classification project"
    }
  ]
}
```

The LLM should generate explanations and learning plans, but the backend
should enforce the final JSON schema.

------------------------------------------------------------------------

# 12. Recommendation Engine

## Recommendation Inputs

``` text
Current Skill
Experience Level
Available Time
Preferred Learning Style
Target Goal
```

## Resource Ranking

For the MVP:

``` text
Final Score =
Skill Match × 0.40
+ Difficulty Match × 0.25
+ Preference Match × 0.15
+ Quality Score × 0.20
```

Example:

``` text
User: Intermediate learner
Skill: Deep Learning
Preference: Videos

Resources:
1. Resource A → Score 0.91
2. Resource B → Score 0.84
3. Resource C → Score 0.76
```

Do not depend entirely on LLM-generated URLs.

Store curated resources in your database.

Use embeddings for semantic matching between:

``` text
Learning Need
        ↔
Resource Description
```

------------------------------------------------------------------------

# 13. AI Chat Assistant

The assistant should have access to tools.

## Available Tools

``` text
get_user_profile()
get_current_roadmap()
get_current_progress()
get_recommended_resources()
update_feedback()
adapt_learning_path()
```

## Example

User asks:

> What should I learn today?

Flow:

``` text
User Message
      ↓
Load User Profile
      ↓
Load Active Roadmap
      ↓
Check Current Progress
      ↓
Find Next Incomplete Task
      ↓
LLM Generates Personalized Response
```

The LLM should never invent the user's progress when database tools can
provide it.

------------------------------------------------------------------------

# 14. Adaptive Learning Engine

## Inputs

``` text
Completion Rate
Assessment Score
Time Taken
User Feedback
Skipped Content
```

## Rules

### If struggling

``` text
Assessment < 50%
OR
Negative Feedback
```

Action:

``` text
Add prerequisite content
Recommend easier resources
Reduce learning load
Add practice exercises
```

### If performing well

``` text
Assessment > 85%
AND
Fast completion
```

Action:

``` text
Reduce basic content
Add advanced material
Recommend challenging project
```

## Adaptation Flow

``` text
Progress Event
      ↓
Evaluate Performance
      ↓
Is Adaptation Required?
      │
      ├── No → Continue Roadmap
      │
      └── Yes
             ↓
      Identify Problem/Opportunity
             ↓
      Modify Future Roadmap Items
             ↓
      Explain Changes to User
```

Important: Preserve completed roadmap items. Only adapt future items.

------------------------------------------------------------------------

# 15. API Design

## Profile

``` text
POST /api/profile
GET  /api/profile
PUT  /api/profile
```

## AI Onboarding

``` text
POST /api/onboarding/chat
POST /api/onboarding/extract-profile
POST /api/onboarding/complete
```

## Roadmap

``` text
POST /api/roadmaps/generate
GET  /api/roadmaps/current
GET  /api/roadmaps/{roadmap_id}
PUT  /api/roadmaps/{roadmap_id}/items/{item_id}
```

## Progress

``` text
POST /api/progress
GET  /api/progress
POST /api/progress/assessment
POST /api/progress/feedback
```

## AI Assistant

``` text
POST /api/chat
```

## Adaptation

``` text
POST /api/roadmaps/adapt
```

------------------------------------------------------------------------

# 16. Frontend Screens

## 1. Landing Page

``` text
Hero
Features
How It Works
Testimonials / Demo
CTA
```

## 2. Onboarding

``` text
Chat Interface

AI:
What do you want to learn?

User:
I want to become an AI Engineer.
```

Include a progress indicator:

``` text
Profile Completion: 60%
```

## 3. Dashboard

``` text
┌────────────────────────────────────────────┐
│ Welcome back                              │
│                                            │
│ Overall Progress: 42%                      │
│ ████████░░░░░░░░░░                         │
│                                            │
│ Current Focus: Deep Learning               │
│ Next Milestone: Build Neural Network       │
└────────────────────────────────────────────┘
```

## 4. Roadmap

``` text
Phase 1 ✓
Foundations

      ↓

Phase 2 → CURRENT
Deep Learning

      ↓

Phase 3
MLOps

      ↓

Phase 4
Capstone Project
```

## 5. Learning Assistant

A persistent chat interface.

Example questions:

``` text
What should I study today?
Why is this topic recommended?
I don't understand this concept.
Can I skip this topic?
I have more time this week.
```

------------------------------------------------------------------------

# 17. Implementation Phases

## Phase 1 --- Foundation

### Goal

Build the SaaS shell.

### Tasks

-   [ ] Create Next.js project
-   [ ] Create FastAPI project
-   [ ] Configure PostgreSQL
-   [ ] Add authentication
-   [ ] Create database models
-   [ ] Create API communication

------------------------------------------------------------------------

## Phase 2 --- Learner Onboarding

### Goal

Collect learner information.

### Tasks

-   [ ] Build chat interface
-   [ ] Save conversation messages
-   [ ] Implement LLM profile extraction
-   [ ] Validate structured output
-   [ ] Save learner profile

------------------------------------------------------------------------

## Phase 3 --- Knowledge Base

### Goal

Create the system's learning intelligence.

### Tasks

-   [ ] Create skills table
-   [ ] Add target roles
-   [ ] Add role skill requirements
-   [ ] Add skill prerequisites
-   [ ] Add curated resources
-   [ ] Add embeddings

Start with only 5--10 target roles.

Example:

``` text
Frontend Developer
Backend Developer
Full Stack Developer
Data Analyst
Data Scientist
Machine Learning Engineer
AI Engineer
DevOps Engineer
Cybersecurity Analyst
```

------------------------------------------------------------------------

## Phase 4 --- Skill Gap Engine

### Tasks

-   [ ] Normalize user skills
-   [ ] Load target role requirements
-   [ ] Compare proficiency levels
-   [ ] Identify gaps
-   [ ] Prioritize important gaps
-   [ ] Order skills using prerequisites

------------------------------------------------------------------------

## Phase 5 --- Roadmap Generator

### Tasks

-   [ ] Calculate available learning hours
-   [ ] Allocate time across skills
-   [ ] Generate learning phases
-   [ ] Create milestones
-   [ ] Attach resources
-   [ ] Generate AI explanations

------------------------------------------------------------------------

## Phase 6 --- Dashboard and Progress

### Tasks

-   [ ] Display roadmap
-   [ ] Mark items complete
-   [ ] Show overall progress
-   [ ] Show current focus
-   [ ] Show next action

------------------------------------------------------------------------

## Phase 7 --- Adaptive Learning

### Tasks

-   [ ] Collect user feedback
-   [ ] Add assessments
-   [ ] Analyze performance
-   [ ] Modify future roadmap
-   [ ] Explain roadmap changes

------------------------------------------------------------------------

# 18. Development Priority

## Build First

``` text
Authentication
    ↓
Learner Profile
    ↓
Skills Database
    ↓
Skill Gap Analysis
    ↓
Roadmap Generation
    ↓
Dashboard
```

## Build After MVP

``` text
Advanced Resource Ranking
    ↓
Vector Search
    ↓
Assessments
    ↓
Adaptive Roadmaps
    ↓
Multi-agent Architecture
```

------------------------------------------------------------------------

# 19. Important Architecture Decisions

## Do This

-   Use structured LLM output
-   Validate AI output with Pydantic
-   Keep skills and prerequisites in the database
-   Use deterministic logic for skill gaps
-   Use the LLM for conversation and explanations
-   Start as a modular monolith
-   Store all roadmap state in PostgreSQL

## Avoid Initially

-   Complex microservices
-   Multiple databases
-   Multiple AI agents
-   Fully autonomous LLM decisions
-   Randomly generated learning resources
-   A huge knowledge graph

------------------------------------------------------------------------

# 20. Prototype Demo Flow

The final prototype demo should work like this:

``` text
1. User signs up
        ↓
2. AI asks:
   "What do you want to become?"
        ↓
3. User:
   "I want to become an AI Engineer"
        ↓
4. AI asks about:
   - Current skills
   - Experience
   - Available time
   - Target deadline
        ↓
5. AI creates learner profile
        ↓
6. Backend calculates skill gaps
        ↓
7. Personalized roadmap is generated
        ↓
8. Dashboard displays:
   - Current phase
   - Progress
   - Next task
   - Milestones
        ↓
9. User gives feedback:
   "Deep learning is difficult"
        ↓
10. Adaptation engine modifies future roadmap
        ↓
11. AI explains:
   "I added neural network fundamentals before CNN."
```

------------------------------------------------------------------------

# 21. Final MVP Definition

A successful first version should answer:

``` text
Who is this learner?
        ↓
What do they want to achieve?
        ↓
What do they already know?
        ↓
What skills are missing?
        ↓
What should they learn next?
        ↓
In what order?
        ↓
Which resources are best for them?
        ↓
Are they progressing?
        ↓
Should the plan change?
```

The core product loop is:

``` text
UNDERSTAND
    ↓
ANALYZE
    ↓
PLAN
    ↓
RECOMMEND
    ↓
TRACK
    ↓
ADAPT
    ↺
```

------------------------------------------------------------------------

# 22. Recommended First Sprint

Build this exact vertical slice first:

-   [ ] User authentication
-   [ ] AI onboarding chat
-   [ ] Profile extraction
-   [ ] PostgreSQL storage
-   [ ] Seed 5 career roles
-   [ ] Seed required skills and prerequisites
-   [ ] Skill gap calculation
-   [ ] Roadmap generation
-   [ ] Roadmap UI

Once this works end-to-end, the remaining features can be added
incrementally.

------------------------------------------------------------------------

# 23. Core Differentiator

The product should not behave like:

> "Enter your goal, get a static roadmap."

It should behave like:

> **A personal AI learning mentor that continuously understands the
> learner, evaluates their skill gaps, tracks their progress, and
> changes their learning path when their needs or performance change.**
