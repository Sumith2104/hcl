import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';
import { bedrock } from '@/lib/aws/bedrock';
import { Roadmap, RoadmapItem, RoadmapResource } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export interface GraphNodeTree {
  id: string;
  label: string;
  type: 'root' | 'strategy' | 'tactic' | 'kpi';
  level: number;
  description?: string;
  complexity?: string;
  resourceType?: 'book' | 'interactive' | 'video' | 'docs' | 'project';
  url?: string;
  author?: string;
  children?: GraphNodeTree[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_demo_101';
    const customGoal = searchParams.get('goal');

    // 1. Retrieve user's active roadmap from Fluxbase (generated during onboarding)
    const roadmap = await fluxbase.getActiveRoadmap(userId);
    const targetGoal = customGoal || roadmap?.target_role || roadmap?.target_goal || 'Software Engineering & Algorithmic Foundations';

    let tree: GraphNodeTree;

    // 2. If user has active roadmap items from onboarding, build tree directly from them
    if (roadmap && roadmap.items && roadmap.items.length > 0 && !customGoal) {
      tree = buildTreeFromRoadmap(roadmap);
    } else {
      // 3. Otherwise generate dynamic AI tree for the requested goal
      tree = await generateAIKnowledgeTree(targetGoal, userId);
    }

    return NextResponse.json({
      success: true,
      targetGoal,
      tree
    });
  } catch (error) {
    console.error('Error generating graph tree:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate graph tree' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { targetGoal, userId = 'usr_demo_101' } = await req.json();
    const goal = targetGoal || 'Personalized Technical Track';

    const tree = await generateAIKnowledgeTree(goal, userId);

    return NextResponse.json({
      success: true,
      targetGoal: goal,
      tree
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * Transforms the user's active Onboarding Roadmap into a multi-level 2D knowledge tree
 */
function buildTreeFromRoadmap(roadmap: Roadmap): GraphNodeTree {
  // Group roadmap items by Phase
  const phasesMap = new Map<number, { title: string; items: RoadmapItem[] }>();

  roadmap.items.forEach(item => {
    if (!phasesMap.has(item.phase)) {
      phasesMap.set(item.phase, {
        title: item.phase_title || `Phase ${item.phase}`,
        items: []
      });
    }
    phasesMap.get(item.phase)!.items.push(item);
  });

  const rootId = `root_${roadmap.id}`;
  const strategyChildren: GraphNodeTree[] = [];

  Array.from(phasesMap.entries()).forEach(([phaseNum, phaseData], pIdx) => {
    const stratId = `strat_${phaseNum}_${pIdx}`;
    const tacticChildren: GraphNodeTree[] = [];

    phaseData.items.forEach((item, iIdx) => {
      const tactId = `tact_${item.id}_${iIdx}`;
      const kpiChildren: GraphNodeTree[] = [];

      // Add attached learning resources as leaf KPI nodes
      if (item.resources && item.resources.length > 0) {
        item.resources.forEach((res: RoadmapResource, rIdx: number) => {
          kpiChildren.push({
            id: `kpi_${res.id || rIdx}_${tactId}`,
            label: res.resource?.title || `${item.skill_name} Learning Resource`,
            type: 'kpi',
            level: 3,
            resourceType: (res.resource?.type as any) || 'interactive',
            author: res.resource?.platform || (res.resource?.type === 'book' ? 'Authoritative Text' : undefined),
            url: res.resource?.url || 'https://google.com/search?q=' + encodeURIComponent(item.skill_name),
            description: res.recommendation_reason || res.resource?.description || `Master ${item.skill_name} with this resource.`
          });
        });
      } else {
        // Synthesize dynamic resource nodes if none attached
        kpiChildren.push({
          id: `kpi_res_book_${tactId}`,
          label: `📖 Textbook: Mastering ${item.skill_name}`,
          type: 'kpi',
          level: 3,
          resourceType: 'book',
          author: 'Curated Reference',
          url: 'https://www.google.com/search?q=' + encodeURIComponent(`${item.skill_name} book pdf`),
          description: `Authoritative reference text and foundational theory for ${item.skill_name}.`
        });
        kpiChildren.push({
          id: `kpi_res_drill_${tactId}`,
          label: `💻 Interactive Sandbox: ${item.skill_name} Drills`,
          type: 'kpi',
          level: 3,
          resourceType: 'interactive',
          author: 'Sandbox Labs',
          url: 'https://github.com/topics/' + encodeURIComponent(item.skill_name.toLowerCase().replace(/\s+/g, '-')),
          description: item.milestone_project ? `Required Capstone: ${item.milestone_project}` : `Hands-on drills for ${item.skill_name}.`
        });
      }

      tacticChildren.push({
        id: tactId,
        label: item.skill_name,
        type: 'tactic',
        level: 2,
        description: item.milestone,
        complexity: `Est: ~${item.estimated_hours} hrs · Step #${item.sequence_order}`,
        children: kpiChildren
      });
    });

    strategyChildren.push({
      id: stratId,
      label: `${phaseNum}. ${phaseData.title}`,
      type: 'strategy',
      level: 1,
      description: `Core modular learning phase with ${phaseData.items.length} key milestones.`,
      children: tacticChildren
    });
  });

  return {
    id: rootId,
    label: roadmap.target_role || roadmap.target_goal || 'Learning Track',
    type: 'root',
    level: 0,
    description: roadmap.target_goal || `Personalized ${roadmap.target_role} roadmap generated via AI onboarding.`,
    children: strategyChildren
  };
}

/**
 * Generates arbitrary N-branch AI Knowledge Tree for ANY domain (DSA, Placement Aptitude, Machine Learning, Rust, Web3, etc.)
 */
async function generateAIKnowledgeTree(goal: string, userId: string): Promise<GraphNodeTree> {
  const cleanGoal = goal.trim().replace(/^i want to learn\s+/i, '').replace(/^roadmap for\s+/i, '');
  const gLower = cleanGoal.toLowerCase();

  // If AWS Bedrock is live, generate via Claude 3.5 Sonnet
  if (bedrock.isLiveConfigured()) {
    try {
      const prompt = `Generate a hierarchical 4-level knowledge tree JSON for the domain: "${cleanGoal}".
Format JSON strictly matching:
{
  "id": "root",
  "label": "${cleanGoal}",
  "type": "root",
  "level": 0,
  "description": "...",
  "children": [
    {
      "id": "strat_1",
      "label": "1. Strategy Pillar Name",
      "type": "strategy",
      "level": 1,
      "children": [
        {
          "id": "tact_1_1",
          "label": "Tactic Sub-Topic",
          "type": "tactic",
          "level": 2,
          "description": "...",
          "children": [
            {
              "id": "kpi_1_1_1",
              "label": "📖 Book / Resource Name",
              "type": "kpi",
              "level": 3,
              "resourceType": "book",
              "author": "Author Name",
              "url": "https://...",
              "description": "..."
            }
          ]
        }
      ]
    }
  ]
}`;
      const res = await bedrock.invokeText(prompt, {
        systemPrompt: 'You are an expert curriculum architect. Output only valid JSON without markdown fences.',
        userId
      });
      const parsed = JSON.parse(res.result.replace(/```json|```/g, '').trim());
      if (parsed && parsed.children && parsed.children.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('Bedrock tree generation fallback:', e);
    }
  }

  // Dynamic Generative Synthesis Engine for arbitrary user goals
  return synthesizeDomainTree(cleanGoal);
}

/**
 * Synthesizes an arbitrary N-branch knowledge tree with domain-specific pillars, tactics, books, and sandboxes
 */
function synthesizeDomainTree(domain: string): GraphNodeTree {
  const dLower = domain.toLowerCase();

  // Aptitude / Placement Preparation
  if (dLower.includes('aptitude') || dLower.includes('placed') || dLower.includes('placement') || dLower.includes('interview')) {
    return {
      id: 'root_aptitude',
      label: 'Campus & Software Placement Aptitude',
      type: 'root',
      level: 0,
      description: 'Comprehensive curriculum for campus recruitment tests, quantitative aptitude, logical reasoning, and technical interview drills.',
      children: [
        {
          id: 'strat_apt_1',
          label: '1. Quantitative Ability & Math Foundations',
          type: 'strategy',
          level: 1,
          children: [
            {
              id: 'tact_apt_1_1',
              label: 'Arithmetic & Speed Calculations',
              type: 'tactic',
              level: 2,
              description: 'Percentages, Profit & Loss, Ratio & Proportion, Averages, and Vedic Math speed shortcuts.',
              complexity: 'Speed Target: <45 seconds per question',
              children: [
                {
                  id: 'kpi_apt_1_1_1',
                  label: '📖 Book: Quantitative Aptitude for Competitive Examinations',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'Dr. R.S. Aggarwal',
                  url: 'https://www.google.com/search?q=Quantitative+Aptitude+RS+Aggarwal',
                  description: 'The standard benchmark textbook with 5000+ solved arithmetic questions and shortcuts.'
                },
                {
                  id: 'kpi_apt_1_1_2',
                  label: '💻 Practice: IndiaBIX Quantitative Practice Sandbox',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'interactive',
                  author: 'IndiaBIX',
                  url: 'https://www.indiabix.com/aptitude/questions-and-answers/',
                  description: 'Topic-wise timed aptitude tests with detailed explanation keys.'
                }
              ]
            },
            {
              id: 'tact_apt_1_2',
              label: 'Algebra, Geometry & Permutations (P&C)',
              type: 'tactic',
              level: 2,
              description: 'Time & Work, Speed Time & Distance, Probability, Combinatorics, and Number Systems.',
              complexity: 'Weightage: 35% in MNC online assessments',
              children: [
                {
                  id: 'kpi_apt_1_2_1',
                  label: '📖 Book: How to Prepare for Quantitative Aptitude for CAT',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'Arun Sharma',
                  url: 'https://www.google.com/search?q=Arun+Sharma+Quantitative+Aptitude',
                  description: 'Advanced problem sets for high-tier company screening tests (TCS Digital, Infosys SP, Cognizant GenC Next).'
                },
                {
                  id: 'kpi_apt_1_2_2',
                  label: '🎥 Video: Speed Math & Time-Work Shortcuts Masterclass',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'video',
                  author: 'Feel Free to Learn',
                  url: 'https://www.youtube.com',
                  description: 'Formula-free shortcut techniques for time & work and pipes & cisterns.'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_apt_2',
          label: '2. Logical Reasoning & Data Interpretation',
          type: 'strategy',
          level: 1,
          children: [
            {
              id: 'tact_apt_2_1',
              label: 'Analytical & Diagrammatic Reasoning',
              type: 'tactic',
              level: 2,
              description: 'Seating Arrangements, Syllogisms, Blood Relations, Coding-Decoding, and Direction Sense.',
              complexity: 'Target: 100% accuracy on arrangement puzzles',
              children: [
                {
                  id: 'kpi_apt_2_1_1',
                  label: '📖 Book: A Modern Approach to Logical Reasoning',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'Dr. R.S. Aggarwal',
                  url: 'https://www.google.com/search?q=RS+Aggarwal+Logical+Reasoning',
                  description: 'Complete verbal and non-verbal reasoning patterns with systematic deductions.'
                },
                {
                  id: 'kpi_apt_2_1_2',
                  label: '💻 Practice: GeeksforGeeks Placement Aptitude Track',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'interactive',
                  author: 'GeeksforGeeks',
                  url: 'https://www.geeksforgeeks.org/aptitude-questions-and-answers/',
                  description: 'Company-specific interview puzzles and reasoning question banks.'
                }
              ]
            },
            {
              id: 'tact_apt_2_2',
              label: 'Data Interpretation (DI) & Caselets',
              type: 'tactic',
              level: 2,
              description: 'Bar charts, Pie charts, Tabular DI, Radar graphs, and Caselet calculations.',
              complexity: 'Speed Target: Analyze dataset in <90 seconds',
              children: [
                {
                  id: 'kpi_apt_2_2_1',
                  label: '📖 Book: Data Interpretation & Data Sufficiency',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'Arun Sharma',
                  url: 'https://www.google.com/search?q=Arun+Sharma+Data+Interpretation',
                  description: 'High-speed approximation and table subtraction methods.'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_apt_3',
          label: '3. Technical Coding & Company Mock Tests',
          type: 'strategy',
          level: 1,
          children: [
            {
              id: 'tact_apt_3_1',
              label: 'Core CS Fundamentals (OOP, DBMS, OS)',
              type: 'tactic',
              level: 2,
              description: 'SQL queries, Normalization, Process Scheduling, Threads, Memory Paging, and OOP concepts.',
              complexity: 'Direct technical round MCQ questions',
              children: [
                {
                  id: 'kpi_apt_3_1_1',
                  label: '📖 Book: Operating System Concepts (Silberschatz)',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'Silberschatz, Galvin, Gagne',
                  url: 'https://os-book.com/',
                  description: 'Authoritative operating systems reference for technical rounds.'
                },
                {
                  id: 'kpi_apt_3_1_2',
                  label: '💻 Practice: Sanfoundry 1000 MCQs on DBMS & OS',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'interactive',
                  author: 'Sanfoundry',
                  url: 'https://www.sanfoundry.com/1000-database-management-system-questions-answers/',
                  description: 'Comprehensive multiple choice questions with answers and explanations.'
                }
              ]
            },
            {
              id: 'tact_apt_3_2',
              label: 'Company-Specific Online Assessment Mocks',
              type: 'tactic',
              level: 2,
              description: 'Simulated 90-minute full mock rounds with negative marking and auto-grading.',
              complexity: 'Goal: >85 percentile score',
              children: [
                {
                  id: 'kpi_apt_3_2_1',
                  label: '🛠️ Capstone: 10 Full-Length Placement Mock Tests',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'project',
                  author: 'AdaptiveLearn Exam Engine',
                  url: 'https://github.com/topics/placement-preparation',
                  description: 'Timed assessment simulator with adaptive difficulty recalibration.'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  // DSA in Python / Language-specific DSA
  if (dLower.includes('dsa') || dLower.includes('data structure') || dLower.includes('algorithm')) {
    const lang = dLower.includes('java') ? 'Java' : dLower.includes('c++') || dLower.includes('cpp') ? 'C++' : 'Python';

    return {
      id: 'root_dsa',
      label: `DSA in ${lang}`,
      type: 'root',
      level: 0,
      description: `Complete algorithmic problem-solving track in ${lang}.`,
      children: [
        {
          id: 'strat_1',
          label: '1. Built-in Collections & Primitives',
          type: 'strategy',
          level: 1,
          children: [
            {
              id: 'tact_1_1',
              label: 'Lists & Dynamic Arrays',
              type: 'tactic',
              level: 2,
              description: 'Memory allocation, dynamic resizing amortized O(1), and two pointers.',
              complexity: 'Time: O(1) access | Space: O(N)',
              children: [
                {
                  id: 'kpi_1_1_1',
                  label: '📖 Book: Fluent Python (Ch. 2 Sequences)',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'Luciano Ramalho',
                  url: 'https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/'
                },
                {
                  id: 'kpi_1_1_2',
                  label: '💻 Practice: NeetCode 150 Arrays & Two Pointers',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'interactive',
                  author: 'NeetCode',
                  url: 'https://neetcode.io/practice'
                }
              ]
            },
            {
              id: 'tact_1_2',
              label: 'Dictionaries, Sets & Hash Tables',
              type: 'tactic',
              level: 2,
              description: 'Hash functions, collision handling, set lookups, and frequency maps.',
              complexity: 'Time: O(1) average lookup | Space: O(N)',
              children: [
                {
                  id: 'kpi_1_2_1',
                  label: '📖 Book: Grokking Algorithms (Ch. 5 Hash Tables)',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'Aditya Bhargava',
                  url: 'https://www.manning.com/books/grokking-algorithms'
                },
                {
                  id: 'kpi_1_2_2',
                  label: '🛠️ Capstone: In-Memory Key-Value Store',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'project',
                  author: 'Curriculum Team',
                  url: 'https://github.com/topics/hashmap-python'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_2',
          label: '2. Linear Structures & Pointers',
          type: 'strategy',
          level: 1,
          children: [
            {
              id: 'tact_2_1',
              label: 'Linked Lists & Reversal Patterns',
              type: 'tactic',
              level: 2,
              children: [
                {
                  id: 'kpi_2_1_1',
                  label: '📖 Book: CLRS (Ch. 10 Elementary Data Structures)',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'CLRS Authors',
                  url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/'
                },
                {
                  id: 'kpi_2_1_2',
                  label: '💻 Practice: LeetCode Linked List Curated',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'interactive',
                  author: 'LeetCode',
                  url: 'https://leetcode.com/problemset/all/?topicSlugs=linked-list'
                }
              ]
            },
            {
              id: 'tact_2_2',
              label: 'Stacks, Queues & Monotonic Deques',
              type: 'tactic',
              level: 2,
              children: [
                {
                  id: 'kpi_2_2_1',
                  label: '🛠️ Capstone: High-Performance LRU Cache',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'project',
                  author: 'AdaptiveLearn Sandbox',
                  url: 'https://github.com/topics/lru-cache-python'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_3',
          label: '3. Hierarchical Trees & Graphs',
          type: 'strategy',
          level: 1,
          children: [
            {
              id: 'tact_3_1',
              label: 'Binary Search Trees & Heap Queues',
              type: 'tactic',
              level: 2,
              children: [
                {
                  id: 'kpi_3_1_1',
                  label: '📖 Book: Algorithm Design Manual (Ch. 3)',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'Steven S. Skiena',
                  url: 'https://www.algorist.com/'
                }
              ]
            },
            {
              id: 'tact_3_2',
              label: 'Graph BFS, DFS & Dijkstra Shortest Path',
              type: 'tactic',
              level: 2,
              children: [
                {
                  id: 'kpi_3_2_1',
                  label: '🎥 Video: MIT 6.006 Dijkstra Shortest Path',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'video',
                  author: 'MIT OCW',
                  url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_4',
          label: '4. Dynamic Programming',
          type: 'strategy',
          level: 1,
          children: [
            {
              id: 'tact_4_1',
              label: '1D Memoization & Tabulation',
              type: 'tactic',
              level: 2,
              children: [
                {
                  id: 'kpi_4_1_1',
                  label: '📖 Book: CLRS (Ch. 15 Dynamic Programming)',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'book',
                  author: 'CLRS Authors',
                  url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/'
                },
                {
                  id: 'kpi_4_1_2',
                  label: '💻 Practice: NeetCode 150 1D DP Suite',
                  type: 'kpi',
                  level: 3,
                  resourceType: 'interactive',
                  author: 'NeetCode',
                  url: 'https://neetcode.io/practice'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  // Generalized N-branch synthesis for any custom goal (Rust, Cloud, Cybersecurity, Flutter, etc.)
  const words = domain.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    id: `root_${dLower.replace(/\s+/g, '_')}`,
    label: words,
    type: 'root',
    level: 0,
    description: `Complete AI-generated prerequisite knowledge graph for ${words}.`,
    children: [
      {
        id: 'strat_gen_1',
        label: `1. ${words} Fundamentals & Primitives`,
        type: 'strategy',
        level: 1,
        children: [
          {
            id: 'tact_gen_1_1',
            label: `${words.split(' ')[0]} Syntax & Core Concepts`,
            type: 'tactic',
            level: 2,
            description: `Core syntax, memory model, execution runtime, and baseline primitives for ${words}.`,
            children: [
              {
                id: 'kpi_gen_1_1_1',
                label: `📖 Textbook: The Definitive Guide to ${words}`,
                type: 'kpi',
                level: 3,
                resourceType: 'book',
                author: 'Industry Experts',
                url: 'https://www.google.com/search?q=' + encodeURIComponent(`${words} textbook guide`),
                description: `Authoritative textbook and foundational principles for ${words}.`
              },
              {
                id: 'kpi_gen_1_1_2',
                label: `💻 Interactive Sandbox: ${words.split(' ')[0]} Code Drills`,
                type: 'kpi',
                level: 3,
                resourceType: 'interactive',
                author: 'Community Sandbox',
                url: 'https://github.com/topics/' + encodeURIComponent(dLower.replace(/\s+/g, '-')),
                description: `Hands-on practice exercises and test cases.`
              }
            ]
          }
        ]
      },
      {
        id: 'strat_gen_2',
        label: `2. Architecture & Design Patterns`,
        type: 'strategy',
        level: 1,
        children: [
          {
            id: 'tact_gen_2_1',
            label: `System Architecture & Integration`,
            type: 'tactic',
            level: 2,
            description: `Modularity, state management, API design, and asynchronous patterns.`,
            children: [
              {
                id: 'kpi_gen_2_1_1',
                label: `🛠️ Capstone: Production ${words.split(' ')[0]} Implementation`,
                type: 'kpi',
                level: 3,
                resourceType: 'project',
                author: 'Open Source Labs',
                url: 'https://github.com',
                description: `Build an end-to-end production capstone application.`
              }
            ]
          }
        ]
      },
      {
        id: 'strat_gen_3',
        label: `3. Advanced Optimization & Production`,
        type: 'strategy',
        level: 1,
        children: [
          {
            id: 'tact_gen_3_1',
            label: `Performance, Scaling & Security`,
            type: 'tactic',
            level: 2,
            description: `Benchmarking, concurrency, error recovery, and cloud deployment pipelines.`,
            children: [
              {
                id: 'kpi_gen_3_1_1',
                label: `🎥 Masterclass: Enterprise ${words} at Scale`,
                type: 'kpi',
                level: 3,
                resourceType: 'video',
                author: 'Conference Keynotes',
                url: 'https://www.youtube.com',
                description: 'Deep dive into production case studies and latency optimization.'
              }
            ]
          }
        ]
      }
    ]
  };
}
