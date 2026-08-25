'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronDown, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Zap, 
  Code, 
  Video, 
  Bookmark, 
  HelpCircle,
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Roadmap, RoadmapItem } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

export interface GraphResourceNode {
  id: string;
  title: string;
  type: 'book' | 'interactive' | 'video' | 'docs' | 'project';
  url: string;
  author?: string;
  description: string;
  isCompleted?: boolean;
}

export interface GraphSubBranch {
  id: string;
  title: string;
  description: string;
  complexity?: string;
  isCompleted?: boolean;
  resources: GraphResourceNode[];
}

export interface GraphBranch {
  id: string;
  title: string;
  category: string;
  isCompleted?: boolean;
  subBranches: GraphSubBranch[];
}

export interface GraphDomainTree {
  domainTitle: string;
  domainSubtitle: string;
  branches: GraphBranch[];
}

interface RoadmapGraph2DProps {
  roadmap: Roadmap | null;
  onItemSelect?: (item: RoadmapItem) => void;
}

export function RoadmapGraph2D({ roadmap, onItemSelect }: RoadmapGraph2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [expandedRoot, setExpandedRoot] = useState(true);
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({
    'branch_0': true,
    'branch_1': true,
    'branch_2': false,
    'branch_3': false,
    'branch_4': false
  });
  const [expandedSubBranches, setExpandedSubBranches] = useState<Record<string, boolean>>({
    'sub_0_0': true,
    'sub_0_1': false,
    'sub_1_0': false
  });

  const [selectedNode, setSelectedNode] = useState<{
    title: string;
    type: 'domain' | 'branch' | 'subbranch' | 'resource';
    description?: string;
    complexity?: string;
    resources?: GraphResourceNode[];
    resourceData?: GraphResourceNode;
  } | null>(null);

  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set());

  // Generate dynamic 2D Graph structure based on the active roadmap target role
  const graphData: GraphDomainTree = useMemo(() => {
    const role = roadmap?.target_role || 'Data Structures & Algorithms in Python';
    const rLower = role.toLowerCase();

    if (rLower.includes('dsa') || rLower.includes('data structure') || rLower.includes('algorithm')) {
      return {
        domainTitle: 'Data Structures & Algorithms in Python',
        domainSubtitle: 'Core Primitives, Linear & Non-Linear Structures, Graph Theory & Dynamic Programming',
        branches: [
          {
            id: 'branch_0',
            title: '1. Python Primitives & Collections',
            category: 'Foundations',
            subBranches: [
              {
                id: 'sub_0_0',
                title: 'Lists, Tuples & Dynamic Arrays',
                description: 'Dynamic resizing, memory layout, indexing O(1), append amortized O(1), slicing and mutability.',
                complexity: 'Time: O(1) access, O(n) insert | Space: O(n)',
                resources: [
                  {
                    id: 'res_book_1',
                    title: 'Fluent Python (Chapter 2: An Array of Sequences)',
                    type: 'book',
                    author: 'Luciano Ramalho',
                    url: 'https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/',
                    description: 'In-depth breakdown of Python list internals, memory buffers, and list comprehensions.'
                  },
                  {
                    id: 'res_dsa_1',
                    title: 'NeetCode 150: Dynamic Array & Sliding Window Sandbox',
                    type: 'interactive',
                    author: 'NeetCode',
                    url: 'https://neetcode.io/practice',
                    description: 'Interactive problem sets covering Two Sum, Best Time to Buy/Sell Stock, and Sliding Window Max.'
                  },
                  {
                    id: 'res_vid_1',
                    title: 'MIT 6.006: Dynamic Arrays & Amortization Analysis',
                    type: 'video',
                    author: 'MIT OpenCourseWare',
                    url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
                    description: 'Mathematical proof of geometric resizing and worst-case vs amortized analysis.'
                  }
                ]
              },
              {
                id: 'sub_0_1',
                title: 'Sets, Dictionaries & Hash Tables',
                description: 'Hash functions, collision resolution via open addressing / chaining, and set theory operations.',
                complexity: 'Time: O(1) average lookup/insert | Space: O(n)',
                resources: [
                  {
                    id: 'res_book_2',
                    title: 'Grokking Algorithms (Chapter 5: Hash Tables)',
                    type: 'book',
                    author: 'Aditya Bhargava',
                    url: 'https://www.manning.com/books/grokking-algorithms',
                    description: 'Visual, intuitive introduction to hash tables, DNS lookups, and load factors.'
                  },
                  {
                    id: 'res_proj_1',
                    title: 'Hands-on Project: Build an In-Memory Hash Map from Scratch',
                    type: 'project',
                    author: 'Curriculum Team',
                    url: 'https://github.com/topics/hashmap-python',
                    description: 'Implement key hashing, bucket arrays, and quadratic probing in pure Python.'
                  }
                ]
              }
            ]
          },
          {
            id: 'branch_1',
            title: '2. Linear Structures & Pointers',
            category: 'Linear Structures',
            subBranches: [
              {
                id: 'sub_1_0',
                title: 'Singly & Doubly Linked Lists',
                description: 'Node pointers, cycle detection (Floyd’s Tortoise and Hare), list reversal, and sentinel nodes.',
                complexity: 'Time: O(1) head insert, O(n) search | Space: O(n)',
                resources: [
                  {
                    id: 'res_book_3',
                    title: 'Introduction to Algorithms (CLRS Chapter 10: Elementary Data Structures)',
                    type: 'book',
                    author: 'Cormen, Leiserson, Rivest, Stein',
                    url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
                    description: 'Rigorous algorithmic proofs for linked list pointer manipulation.'
                  },
                  {
                    id: 'res_dsa_2',
                    title: 'LeetCode: Reverse Linked List & Fast/Slow Pointer Track',
                    type: 'interactive',
                    author: 'LeetCode Curated',
                    url: 'https://leetcode.com/problemset/all/?topicSlugs=linked-list',
                    description: 'Master in-place pointer reversal and cycle finding algorithms.'
                  }
                ]
              },
              {
                id: 'sub_1_1',
                title: 'Stacks, Queues & Monotonic Deques',
                description: 'LIFO & FIFO semantics, collections.deque, Next Greater Element, and Sliding Window Max.',
                complexity: 'Time: O(1) push/pop | Space: O(n)',
                resources: [
                  {
                    id: 'res_proj_2',
                    title: 'Capstone Project: Build a High-Performance LRU Cache',
                    type: 'project',
                    author: 'AdaptiveLearn Sandbox',
                    url: 'https://github.com/topics/lru-cache-python',
                    description: 'Combine a Doubly Linked List with a Hash Map for O(1) get/put operations.'
                  }
                ]
              }
            ]
          },
          {
            id: 'branch_2',
            title: '3. Hierarchical Non-Linear Structures',
            category: 'Trees & Heaps',
            subBranches: [
              {
                id: 'sub_2_0',
                title: 'Binary Trees & Binary Search Trees (BST)',
                description: 'Tree traversals (Inorder, Preorder, Postorder, Level-Order), validation, LCA, and balance factors.',
                complexity: 'Time: O(log n) balanced search, O(n) worst | Space: O(h)',
                resources: [
                  {
                    id: 'res_book_4',
                    title: 'Algorithm Design Manual (Chapter 3: Data Structures)',
                    type: 'book',
                    author: 'Steven S. Skiena',
                    url: 'https://www.algorist.com/',
                    description: 'Practical guide to binary search trees, balanced AVL trees, and Red-Black trees.'
                  },
                  {
                    id: 'res_vid_2',
                    title: 'Binary Tree Traversal Masterclass (BFS vs DFS)',
                    type: 'video',
                    author: 'FreeCodeCamp',
                    url: 'https://www.youtube.com/watch?v=fAAZixBzIAI',
                    description: 'Visual recursive call stack breakdowns and iterative stack traversal.'
                  }
                ]
              },
              {
                id: 'sub_2_1',
                title: 'Min/Max Heaps & Tries (Prefix Trees)',
                description: 'Priority queues using heapq, binary heap sift-up/down, prefix search auto-complete.',
                complexity: 'Time: O(log n) push/pop, O(L) Trie search | Space: O(n)',
                resources: [
                  {
                    id: 'res_proj_3',
                    title: 'Project: Build a Trie Auto-Complete Search Engine',
                    type: 'project',
                    author: 'Open Source Community',
                    url: 'https://github.com/topics/trie-autocomplete',
                    description: 'Store dictionary words in a character prefix tree and query top completions in O(L).'
                  }
                ]
              }
            ]
          },
          {
            id: 'branch_3',
            title: '4. Graph Algorithms & Traversals',
            category: 'Graph Theory',
            subBranches: [
              {
                id: 'sub_3_0',
                title: 'Breadth-First Search (BFS) & Depth-First (DFS)',
                description: 'Adjacency lists, visited sets, connected components, cycle detection in directed graphs.',
                complexity: 'Time: O(V + E) | Space: O(V)',
                resources: [
                  {
                    id: 'res_book_5',
                    title: 'Grokking Algorithms (Chapter 6 & 7: Breadth-First Search & Dijkstra)',
                    type: 'book',
                    author: 'Aditya Bhargava',
                    url: 'https://www.manning.com/books/grokking-algorithms',
                    description: 'Shortest path on unweighted graphs and mango seller network problem.'
                  },
                  {
                    id: 'res_dsa_3',
                    title: 'Graph Traversal Interactive Playground',
                    type: 'interactive',
                    author: 'Visualgo',
                    url: 'https://visualgo.net/en/dfsbfs',
                    description: 'Step through BFS and DFS executions with animated queue and stack states.'
                  }
                ]
              },
              {
                id: 'sub_3_1',
                title: 'Topological Sort & Dijkstra Shortest Path',
                description: 'Kahn’s In-Degree algorithm, priority queue Dijkstra for non-negative weighted graphs.',
                complexity: 'Time: O((V + E) log V) with Min-Heap | Space: O(V)',
                resources: [
                  {
                    id: 'res_vid_3',
                    title: 'MIT 6.006: Dijkstra Algorithm & Path Relaxation',
                    type: 'video',
                    author: 'MIT OpenCourseWare',
                    url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
                    description: 'Detailed analysis of edge relaxation and correctness invariant proofs.'
                  }
                ]
              }
            ]
          },
          {
            id: 'branch_4',
            title: '5. Dynamic Programming & Optimization',
            category: 'Advanced DP',
            subBranches: [
              {
                id: 'sub_4_0',
                title: '1D Memoization & Tabulation Patterns',
                description: 'Overlapping subproblems, optimal substructure, Climbing Stairs, House Robber, Coin Change.',
                complexity: 'Time: O(n) | Space: O(n) or O(1)',
                resources: [
                  {
                    id: 'res_book_6',
                    title: 'Introduction to Algorithms (CLRS Chapter 15: Dynamic Programming)',
                    type: 'book',
                    author: 'CLRS Authors',
                    url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
                    description: 'Rigorous state transition equation formulation and space optimization.'
                  },
                  {
                    id: 'res_dsa_4',
                    title: 'NeetCode 150: 1D Dynamic Programming Suite',
                    type: 'interactive',
                    author: 'NeetCode',
                    url: 'https://neetcode.io/practice',
                    description: '12 core DP problem patterns with step-by-step Python code templates.'
                  }
                ]
              },
              {
                id: 'sub_4_1',
                title: '2D Matrix DP & Knapsack Variants',
                description: 'Longest Common Subsequence (LCS), 0/1 Knapsack, Edit Distance, and Unique Grid Paths.',
                complexity: 'Time: O(m * n) | Space: O(m * n)',
                resources: [
                  {
                    id: 'res_proj_4',
                    title: 'Capstone: Algorithmic DNA Sequence Alignment Tool',
                    type: 'project',
                    author: 'Bioinformatics Lab',
                    url: 'https://github.com/topics/sequence-alignment-python',
                    description: 'Implement the Needleman-Wunsch global alignment DP matrix in Python.'
                  }
                ]
              }
            ]
          }
        ]
      };
    }

    // Default Full Stack / AI Engineer Tree
    return {
      domainTitle: role,
      domainSubtitle: 'Deterministic Prerequisite Graph & Micro-Competency Milestones',
      branches: [
        {
          id: 'branch_0',
          title: '1. Foundations & Core Syntax',
          category: 'Pillar 1',
          subBranches: [
            {
              id: 'sub_0_0',
              title: 'Language Runtime & Architecture',
              description: 'Execution context, memory layout, event loops, and core syntax.',
              resources: [
                {
                  id: 'res_gen_1',
                  title: 'Core Fundamentals & Reference Manual',
                  type: 'docs',
                  url: 'https://developer.mozilla.org',
                  description: 'Authoritative documentation and architectural overview.'
                }
              ]
            }
          ]
        },
        {
          id: 'branch_1',
          title: '2. Data Layer & Database Architecture',
          category: 'Pillar 2',
          subBranches: [
            {
              id: 'sub_1_0',
              title: 'PostgreSQL & Fluxbase Relational Modeling',
              description: 'Relational schemas, foreign keys, indexing, and JSONB queries.',
              resources: [
                {
                  id: 'res_gen_2',
                  title: 'Fluxbase Cloud Database Developer Guide',
                  type: 'docs',
                  url: 'https://fluxbase.vercel.app',
                  description: 'Execute SQL queries, manage relations, and audit schema versions.'
                }
              ]
            }
          ]
        },
        {
          id: 'branch_2',
          title: '3. Production Systems & Deployment',
          category: 'Pillar 3',
          subBranches: [
            {
              id: 'sub_2_0',
              title: 'Cloud Architecture & Bedrock LLM Integration',
              description: 'Serverless APIs, cost-governed Bedrock invocations, and production monitoring.',
              resources: [
                {
                  id: 'res_gen_3',
                  title: 'AWS Bedrock Foundation Model SDK Manual',
                  type: 'docs',
                  url: 'https://aws.amazon.com/bedrock/',
                  description: 'Invoke Claude 3.5 Sonnet and Amazon Nova with streaming responses.'
                }
              ]
            }
          ]
        }
      ]
    };
  }, [roadmap]);

  const toggleBranch = (id: string) => {
    setExpandedBranches(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSubBranch = (id: string) => {
    setExpandedSubBranches(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleNodeClick = (nodeData: any) => {
    setSelectedNode(nodeData);
  };

  const toggleNodeCompletion = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 }
        });
      }
      return next;
    });
  };

  const totalSubTopics = graphData.branches.reduce((acc, b) => acc + b.subBranches.length, 0);
  const completedCount = Array.from(completedNodeIds).length;
  const progressPct = totalSubTopics > 0 ? Math.min(100, Math.round((completedCount / totalSubTopics) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* Top Controls & Graph Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50/90 border border-neutral-200/80 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
              2D Interactive Branching Graph (Mindmap DAG)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-neutral-200/70 text-[10px] font-mono font-medium text-neutral-700">
              Interactive Canvas
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Touch or click any node to expand sub-branches, textbooks, problem sandboxes, and video lectures.
          </p>
        </div>

        {/* Action Buttons & Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setZoom(prev => Math.max(0.7, prev - 0.1))}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-semibold px-2 text-neutral-700 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.1))}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              const allExpanded = Object.values(expandedBranches).every(Boolean);
              const nextVal = !allExpanded;
              const nextBranches: Record<string, boolean> = {};
              const nextSubs: Record<string, boolean> = {};
              graphData.branches.forEach(b => {
                nextBranches[b.id] = nextVal;
                b.subBranches.forEach(s => {
                  nextSubs[s.id] = nextVal;
                });
              });
              setExpandedBranches(nextBranches);
              setExpandedSubBranches(nextSubs);
            }}
            className="btn-outline !py-2 !px-3 !text-xs inline-flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>
        </div>
      </div>

      {/* Main 2D Visual Tree Canvas */}
      <div 
        ref={containerRef}
        className="relative w-full rounded-2xl bg-white border border-neutral-200/80 p-6 sm:p-10 overflow-x-auto min-h-[580px] shadow-sm flex items-start"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e5e5 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div 
          className="flex items-start gap-12 sm:gap-16 transition-transform duration-200 ease-out origin-top-left py-4"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* LEVEL 0: ROOT DOMAIN BLOCK (Left) */}
          <div className="flex flex-col items-center shrink-0">
            <div
              onClick={() => {
                setExpandedRoot(!expandedRoot);
                handleNodeClick({
                  title: graphData.domainTitle,
                  type: 'domain',
                  description: graphData.domainSubtitle
                });
              }}
              className={cn(
                "w-64 p-4 rounded-2xl bg-neutral-900 text-white shadow-xl border-2 border-neutral-800 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl relative group select-none",
                expandedRoot ? "ring-4 ring-neutral-900/10" : ""
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] font-mono text-neutral-300 font-semibold uppercase tracking-wider">
                  Target Domain
                </span>
                <div className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-white transition-colors">
                  {expandedRoot ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </div>

              <h3 className="text-sm font-bold tracking-tight text-white leading-snug">
                {graphData.domainTitle}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                {graphData.domainSubtitle}
              </p>

              {/* Stats Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800 text-[10px] font-mono text-neutral-400">
                <span>{graphData.branches.length} Core Pillars</span>
                <span>{completedCount}/{totalSubTopics} Mastered</span>
              </div>
            </div>
          </div>

          {/* LEVEL 1: PRIMARY BRANCHES (Middle-Left) */}
          {expandedRoot && (
            <div className="flex flex-col gap-8 shrink-0 relative">
              {graphData.branches.map((branch, bIdx) => {
                const isBranchExpanded = expandedBranches[branch.id];
                const completedInBranch = branch.subBranches.filter(s => completedNodeIds.has(s.id)).length;
                const isBranchComplete = completedInBranch === branch.subBranches.length && branch.subBranches.length > 0;

                return (
                  <div key={branch.id} className="flex items-center gap-10 sm:gap-14 relative group">
                    {/* Branch Node Card */}
                    <div
                      onClick={() => {
                        toggleBranch(branch.id);
                        handleNodeClick({
                          title: branch.title,
                          type: 'branch',
                          description: `${branch.subBranches.length} key modular competencies in this learning pillar.`
                        });
                      }}
                      className={cn(
                        "w-56 p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md select-none bg-white relative",
                        isBranchExpanded
                          ? "border-neutral-900 ring-2 ring-neutral-900/5 shadow-md"
                          : "border-neutral-200 hover:border-neutral-400",
                        isBranchComplete ? "bg-emerald-50/40 border-emerald-300" : ""
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                          {branch.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isBranchComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <span className="text-[10px] font-mono text-neutral-400">
                              {completedInBranch}/{branch.subBranches.length}
                            </span>
                          )}
                          <div className="w-5 h-5 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-600">
                            {isBranchExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-neutral-900 leading-snug">
                        {branch.title}
                      </h4>
                    </div>

                    {/* LEVEL 2 & 3: SUB-BRANCHES & RESOURCES (Right) */}
                    {isBranchExpanded && (
                      <div className="flex flex-col gap-4 shrink-0 pl-2">
                        {branch.subBranches.map((sub, sIdx) => {
                          const isSubExpanded = expandedSubBranches[sub.id];
                          const isSubCompleted = completedNodeIds.has(sub.id);

                          return (
                            <div key={sub.id} className="flex items-center gap-6 sm:gap-10 relative">
                              {/* Sub-Branch Card */}
                              <div
                                onClick={() => {
                                  toggleSubBranch(sub.id);
                                  handleNodeClick({
                                    title: sub.title,
                                    type: 'subbranch',
                                    description: sub.description,
                                    complexity: sub.complexity,
                                    resources: sub.resources
                                  });
                                }}
                                className={cn(
                                  "w-64 p-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm bg-white select-none relative group",
                                  isSubExpanded
                                    ? "border-neutral-900 bg-neutral-50/50"
                                    : "border-neutral-200 hover:border-neutral-300",
                                  isSubCompleted ? "bg-emerald-50/60 border-emerald-300" : ""
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={(e) => toggleNodeCompletion(sub.id, e)}
                                        className="text-neutral-400 hover:text-emerald-600 transition-colors"
                                        title={isSubCompleted ? "Mark Incomplete" : "Mark Mastered"}
                                      >
                                        {isSubCompleted ? (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                                        ) : (
                                          <Circle className="w-4 h-4" />
                                        )}
                                      </button>
                                      <h5 className="text-xs font-semibold text-neutral-900 leading-snug">
                                        {sub.title}
                                      </h5>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed pl-5">
                                      {sub.description}
                                    </p>
                                  </div>

                                  <div className="w-5 h-5 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0 mt-0.5">
                                    {isSubExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  </div>
                                </div>

                                {sub.complexity && (
                                  <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                                    <span>{sub.complexity}</span>
                                    <span className="text-indigo-600 font-semibold">{sub.resources.length} Links</span>
                                  </div>
                                )}
                              </div>

                              {/* LEVEL 3: RESOURCE LEAFS (Books, Sandboxes, Videos) */}
                              {isSubExpanded && (
                                <div className="flex flex-col gap-2 shrink-0">
                                  {sub.resources.map(res => {
                                    const isResComplete = completedNodeIds.has(res.id);

                                    return (
                                      <div
                                        key={res.id}
                                        onClick={() => {
                                          handleNodeClick({
                                            title: res.title,
                                            type: 'resource',
                                            description: res.description,
                                            resourceData: res
                                          });
                                        }}
                                        className={cn(
                                          "w-60 p-2.5 rounded-xl border bg-white shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-2 select-none group",
                                          isResComplete ? "bg-emerald-50/40 border-emerald-300" : "border-neutral-200 hover:border-neutral-300"
                                        )}
                                      >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          <div className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs",
                                            res.type === 'book' ? "bg-amber-100 text-amber-800" :
                                            res.type === 'interactive' ? "bg-indigo-100 text-indigo-800" :
                                            res.type === 'video' ? "bg-rose-100 text-rose-800" :
                                            "bg-neutral-100 text-neutral-800"
                                          )}>
                                            {res.type === 'book' && <BookOpen className="w-3.5 h-3.5" />}
                                            {res.type === 'interactive' && <Code className="w-3.5 h-3.5" />}
                                            {res.type === 'video' && <Video className="w-3.5 h-3.5" />}
                                            {res.type === 'project' && <Zap className="w-3.5 h-3.5" />}
                                            {res.type === 'docs' && <Compass className="w-3.5 h-3.5" />}
                                          </div>
                                          <div className="overflow-hidden">
                                            <p className="text-[11px] font-semibold text-neutral-900 truncate leading-tight">
                                              {res.title}
                                            </p>
                                            <p className="text-[10px] text-neutral-400 truncate font-mono">
                                              {res.author || res.type.toUpperCase()}
                                            </p>
                                          </div>
                                        </div>

                                        <a
                                          href={res.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={e => e.stopPropagation()}
                                          className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0"
                                          title="Open External Resource"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating / Side Inspection Drawer */}
      {selectedNode && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-white border-l border-neutral-200 shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-[10px] font-mono font-bold uppercase text-neutral-600">
              {selectedNode.type} Node Details
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              {selectedNode.title}
            </h3>
            {selectedNode.description && (
              <p className="text-xs text-neutral-600 leading-relaxed">
                {selectedNode.description}
              </p>
            )}
          </div>

          {selectedNode.complexity && (
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                Complexity Specifications
              </span>
              <p className="text-xs font-mono font-semibold text-neutral-900">
                {selectedNode.complexity}
              </p>
            </div>
          )}

          {/* If Sub-Branch, list its resources */}
          {selectedNode.resources && selectedNode.resources.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                Curated Textbooks, Sandboxes & Video Lectures ({selectedNode.resources.length})
              </h4>
              <div className="space-y-2">
                {selectedNode.resources.map(res => (
                  <div
                    key={res.id}
                    className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase",
                          res.type === 'book' ? "bg-amber-100 text-amber-800" :
                          res.type === 'interactive' ? "bg-indigo-100 text-indigo-800" :
                          "bg-rose-100 text-rose-800"
                        )}>
                          {res.type}
                        </span>
                        <h5 className="text-xs font-bold text-neutral-900 leading-tight">
                          {res.title}
                        </h5>
                      </div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      {res.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If Direct Resource */}
          {selectedNode.resourceData && (
            <div className="space-y-4 pt-2">
              <a
                href={selectedNode.resourceData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-black !py-2.5 inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Launch Resource Link</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
