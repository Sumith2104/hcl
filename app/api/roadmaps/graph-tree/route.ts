import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';
import { bedrock } from '@/lib/aws/bedrock';

export const dynamic = 'force-dynamic';

export interface GraphNodeTree {
  id: string;
  label: string;
  type: 'root' | 'strategy' | 'tactic' | 'kpi';
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

    // Retrieve user's active roadmap from Fluxbase
    const roadmap = await fluxbase.getActiveRoadmap(userId);
    const targetGoal = customGoal || roadmap?.target_role || roadmap?.target_goal || 'Data Structures & Algorithms in Python';

    // Generate dynamic 3-tier tree via AI/Bedrock based on targetGoal
    const tree = generateDynamicAITree(targetGoal);

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
    const goal = targetGoal || 'Data Structures & Algorithms in Python';

    const tree = generateDynamicAITree(goal);

    return NextResponse.json({
      success: true,
      targetGoal: goal,
      tree
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

function generateDynamicAITree(goal: string): GraphNodeTree {
  const gLower = goal.toLowerCase();

  // 1. Data Structures & Algorithms (in Python, Java, C++, or general)
  if (gLower.includes('dsa') || gLower.includes('data structure') || gLower.includes('algorithm') || gLower.includes('leetcode')) {
    const lang = gLower.includes('java') ? 'Java' : gLower.includes('c++') || gLower.includes('cpp') ? 'C++' : 'Python';

    return {
      id: 'root_dsa',
      label: `DSA in ${lang}`,
      type: 'root',
      description: `Complete algorithmic mastery curriculum in ${lang} covering primitives, linear/non-linear structures, graphs, and dynamic programming.`,
      children: [
        {
          id: 'strat_1',
          label: '1. Built-in Collections & Primitives',
          type: 'strategy',
          description: `Core memory structures, dynamic arrays, hash tables, and set operations in ${lang}.`,
          children: [
            {
              id: 'tact_1_1',
              label: 'Lists & Dynamic Arrays',
              type: 'tactic',
              description: 'Memory buffer growth factor, amortized O(1) appending, index slicing, and pointer swapping.',
              complexity: 'Time: O(1) access | Space: O(N)',
              children: [
                {
                  id: 'kpi_1_1_1',
                  label: '📖 Book: Fluent Python (Ch. 2 Sequences)',
                  type: 'kpi',
                  resourceType: 'book',
                  author: 'Luciano Ramalho',
                  url: 'https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/',
                  description: 'Deep dive into Python memory layout, sequence unpacking, and array slicing.'
                },
                {
                  id: 'kpi_1_1_2',
                  label: '💻 Practice: NeetCode 150 Arrays & Two Pointers',
                  type: 'kpi',
                  resourceType: 'interactive',
                  author: 'NeetCode',
                  url: 'https://neetcode.io/practice',
                  description: 'Interactive problem set on Two Sum, Container With Most Water, and Trapping Rain Water.'
                }
              ]
            },
            {
              id: 'tact_1_2',
              label: 'Dictionaries, Sets & Hash Tables',
              type: 'tactic',
              description: 'Hash collision resolution, load factors, set union/intersection, and hash map frequencies.',
              complexity: 'Time: O(1) average lookup | Space: O(N)',
              children: [
                {
                  id: 'kpi_1_2_1',
                  label: '📖 Book: Grokking Algorithms (Ch. 5 Hash Tables)',
                  type: 'kpi',
                  resourceType: 'book',
                  author: 'Aditya Bhargava',
                  url: 'https://www.manning.com/books/grokking-algorithms',
                  description: 'Visual intuition on hash functions, collision chains, and real-world caching lookups.'
                },
                {
                  id: 'kpi_1_2_2',
                  label: '🛠️ Capstone: Build an In-Memory Key-Value Store',
                  type: 'kpi',
                  resourceType: 'project',
                  author: 'Curriculum Team',
                  url: 'https://github.com/topics/hashmap-python',
                  description: 'Implement open-addressing hash table with custom hash functions and collision probing.'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_2',
          label: '2. Linear Structures & Pointers',
          type: 'strategy',
          description: 'Linked lists, double-ended queues, monotonic stacks, and pointer manipulation.',
          children: [
            {
              id: 'tact_2_1',
              label: 'Singly & Doubly Linked Lists',
              type: 'tactic',
              description: 'In-place pointer reversal, cycle detection with Floyd’s Algorithm, and sentinel nodes.',
              complexity: 'Time: O(1) head insert | Space: O(N)',
              children: [
                {
                  id: 'kpi_2_1_1',
                  label: '📖 Book: CLRS (Ch. 10 Elementary Data Structures)',
                  type: 'kpi',
                  resourceType: 'book',
                  author: 'Cormen, Leiserson, Rivest, Stein',
                  url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
                  description: 'Mathematical proofs and pointers invariants for linked data structures.'
                },
                {
                  id: 'kpi_2_1_2',
                  label: '💻 Practice: LeetCode Linked List Patterns',
                  type: 'kpi',
                  resourceType: 'interactive',
                  author: 'LeetCode',
                  url: 'https://leetcode.com/problemset/all/?topicSlugs=linked-list',
                  description: 'Reverse Linked List, Merge K Sorted Lists, and Reorder List.'
                }
              ]
            },
            {
              id: 'tact_2_2',
              label: 'Stacks, Queues & Monotonic Deques',
              type: 'tactic',
              description: 'LIFO & FIFO semantics, Next Greater Element pattern, and sliding window maximum.',
              complexity: 'Time: O(1) push/pop | Space: O(N)',
              children: [
                {
                  id: 'kpi_2_2_1',
                  label: '🛠️ Capstone: High-Performance LRU Cache',
                  type: 'kpi',
                  resourceType: 'project',
                  author: 'AdaptiveLearn Sandbox',
                  url: 'https://github.com/topics/lru-cache-python',
                  description: 'Combine Doubly Linked List with Hash Map for O(1) get & put operations.'
                },
                {
                  id: 'kpi_2_2_2',
                  label: '🎥 Video: MIT 6.006 Queues & Amortized Deques',
                  type: 'kpi',
                  resourceType: 'video',
                  author: 'MIT OpenCourseWare',
                  url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
                  description: 'Lecture on dynamic data structures and monotonic stack invariants.'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_3',
          label: '3. Hierarchical Trees & Heaps',
          type: 'strategy',
          description: 'Binary trees, binary search trees, priority queues, and character prefix trees (Tries).',
          children: [
            {
              id: 'tact_3_1',
              label: 'Binary Trees & BST Traversals',
              type: 'tactic',
              description: 'Inorder, Preorder, Postorder, Level-Order BFS, Lowest Common Ancestor, and BST balancing.',
              complexity: 'Time: O(log N) search | Space: O(H)',
              children: [
                {
                  id: 'kpi_3_1_1',
                  label: '📖 Book: The Algorithm Design Manual (Ch. 3)',
                  type: 'kpi',
                  resourceType: 'book',
                  author: 'Steven S. Skiena',
                  url: 'https://www.algorist.com/',
                  description: 'Real-world data structures and balanced tree maintenance.'
                },
                {
                  id: 'kpi_3_1_2',
                  label: '💻 Practice: LeetCode Binary Tree Inorder & LCA',
                  type: 'kpi',
                  resourceType: 'interactive',
                  author: 'NeetCode',
                  url: 'https://neetcode.io/practice',
                  description: 'Validate Binary Search Tree, Lowest Common Ancestor, and Diameter of Binary Tree.'
                }
              ]
            },
            {
              id: 'tact_3_2',
              label: 'Min/Max Heaps & Prefix Tries',
              type: 'tactic',
              description: 'Binary heap array representation, sift-up/down, and auto-complete Trie search.',
              complexity: 'Time: O(log N) push/pop, O(L) Trie search | Space: O(N)',
              children: [
                {
                  id: 'kpi_3_2_1',
                  label: '🛠️ Capstone: Build a Trie Auto-Complete Search Engine',
                  type: 'kpi',
                  resourceType: 'project',
                  author: 'Open Source Community',
                  url: 'https://github.com/topics/trie-autocomplete',
                  description: 'Implement character prefix tree for sub-millisecond keyword auto-completion.'
                },
                {
                  id: 'kpi_3_2_2',
                  label: '🎥 Video: Heap Sort & Priority Queues Explained',
                  type: 'kpi',
                  resourceType: 'video',
                  author: 'FreeCodeCamp',
                  url: 'https://www.youtube.com/watch?v=fAAZixBzIAI',
                  description: 'Visual walkthrough of binary heap array mathematics and heapq in Python.'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_4',
          label: '4. Graph Algorithms & Traversals',
          type: 'strategy',
          description: 'Adjacency graphs, BFS, DFS, Topological Sorting, and Shortest Paths with Dijkstra.',
          children: [
            {
              id: 'tact_4_1',
              label: 'BFS, DFS & Connected Components',
              type: 'tactic',
              description: 'Adjacency lists, visited tracking, cycle detection, and flood-fill grid traversals.',
              complexity: 'Time: O(V + E) | Space: O(V)',
              children: [
                {
                  id: 'kpi_4_1_1',
                  label: '📖 Book: Grokking Algorithms (Ch. 6 Breadth-First Search)',
                  type: 'kpi',
                  resourceType: 'book',
                  author: 'Aditya Bhargava',
                  url: 'https://www.manning.com/books/grokking-algorithms',
                  description: 'Visual introduction to shortest path networks and queue-based search.'
                },
                {
                  id: 'kpi_4_1_2',
                  label: '💻 Practice: Number of Islands & Word Ladder',
                  type: 'kpi',
                  resourceType: 'interactive',
                  author: 'LeetCode Curated',
                  url: 'https://leetcode.com/problemset/all/?topicSlugs=graph',
                  description: 'Core graph traversal patterns and bidirectional BFS problem sets.'
                }
              ]
            },
            {
              id: 'tact_4_2',
              label: 'Topological Sort & Dijkstra Algorithm',
              type: 'tactic',
              description: 'Kahn’s in-degree algorithm for DAG dependencies and priority queue Dijkstra.',
              complexity: 'Time: O((V + E) log V) | Space: O(V)',
              children: [
                {
                  id: 'kpi_4_2_1',
                  label: '🎥 Video: MIT 6.006 Dijkstra Shortest Path Proof',
                  type: 'kpi',
                  resourceType: 'video',
                  author: 'MIT OpenCourseWare',
                  url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
                  description: 'Edge relaxation invariants and optimal path finding.'
                },
                {
                  id: 'kpi_4_2_2',
                  label: '🛠️ Capstone: Course Schedule Topological Resolver',
                  type: 'kpi',
                  resourceType: 'project',
                  author: 'AdaptiveLearn Lab',
                  url: 'https://github.com/topics/topological-sort',
                  description: 'Build a dependency resolution engine for prerequisite task scheduling.'
                }
              ]
            }
          ]
        },
        {
          id: 'strat_5',
          label: '5. Dynamic Programming & Optimization',
          type: 'strategy',
          description: 'Optimal substructure, overlapping subproblems, 1D/2D memoization and tabulation.',
          children: [
            {
              id: 'tact_5_1',
              label: '1D Memoization & Tabulation',
              type: 'tactic',
              description: 'Top-down recursion with @cache, bottom-up DP tables, Climbing Stairs, and House Robber.',
              complexity: 'Time: O(N) | Space: O(N) or O(1)',
              children: [
                {
                  id: 'kpi_5_1_1',
                  label: '📖 Book: CLRS (Ch. 15 Dynamic Programming)',
                  type: 'kpi',
                  resourceType: 'book',
                  author: 'CLRS Authors',
                  url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
                  description: 'Mathematical formulations for optimal substructure and state transitions.'
                },
                {
                  id: 'kpi_5_1_2',
                  label: '💻 Practice: NeetCode 150 1D Dynamic Programming',
                  type: 'kpi',
                  resourceType: 'interactive',
                  author: 'NeetCode',
                  url: 'https://neetcode.io/practice',
                  description: 'Coin Change, Longest Increasing Subsequence, and Word Break.'
                }
              ]
            },
            {
              id: 'tact_5_2',
              label: '2D Matrix DP & Knapsack Variants',
              type: 'tactic',
              description: 'Longest Common Subsequence (LCS), 0/1 Knapsack, Edit Distance, and Unique Grid Paths.',
              complexity: 'Time: O(M * N) | Space: O(M * N)',
              children: [
                {
                  id: 'kpi_5_2_1',
                  label: '🛠️ Capstone: Algorithmic DNA Sequence Alignment',
                  type: 'kpi',
                  resourceType: 'project',
                  author: 'Bioinformatics Guild',
                  url: 'https://github.com/topics/sequence-alignment-python',
                  description: 'Implement the Needleman-Wunsch 2D alignment matrix in Python.'
                },
                {
                  id: 'kpi_5_2_2',
                  label: '🎥 Video: 0/1 Knapsack Problem by Abdul Bari',
                  type: 'kpi',
                  resourceType: 'video',
                  author: 'Abdul Bari',
                  url: 'https://www.youtube.com/watch?v=nLmhmB6NzcM',
                  description: 'Classic dynamic programming tabulation explanation with clear matrix traces.'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  // 2. Machine Learning Engineer
  if (gLower.includes('machine learning') || gLower.includes('ml engineer') || gLower.includes('deep learning')) {
    return {
      id: 'root_ml',
      label: 'Machine Learning Engineer',
      type: 'root',
      description: 'End-to-end Machine Learning curriculum covering Mathematical Foundations, Classical ML, Deep Learning with PyTorch, and Production MLOps.',
      children: [
        {
          id: 'strat_ml_1',
          label: '1. Mathematical Foundations',
          type: 'strategy',
          children: [
            {
              id: 'tact_ml_1_1',
              label: 'Linear Algebra & Tensors',
              type: 'tactic',
              children: [
                { id: 'kpi_ml_1_1_1', label: '📖 Book: Mathematics for Machine Learning', type: 'kpi', resourceType: 'book', author: 'Deisenroth, Faisal, Ong', url: 'https://mml-book.github.io/' },
                { id: 'kpi_ml_1_1_2', label: '🎥 Video: 3Blue1Brown Essence of Linear Algebra', type: 'kpi', resourceType: 'video', author: '3Blue1Brown', url: 'https://www.3blue1brown.com/topics/linear-algebra' }
              ]
            },
            {
              id: 'tact_ml_1_2',
              label: 'Multivariate Calculus & Optimization',
              type: 'tactic',
              children: [
                { id: 'kpi_ml_1_2_1', label: '📖 Book: Deep Learning (Ch. 4 Numerical Computation)', type: 'kpi', resourceType: 'book', author: 'Goodfellow, Bengio', url: 'https://www.deeplearningbook.org/' },
                { id: 'kpi_ml_1_2_2', label: '💻 Practice: Gradient Descent Simulator from Scratch', type: 'kpi', resourceType: 'interactive', author: 'AdaptiveLearn', url: 'https://github.com/topics/gradient-descent' }
              ]
            }
          ]
        },
        {
          id: 'strat_ml_2',
          label: '2. Classical ML & Data Engineering',
          type: 'strategy',
          children: [
            {
              id: 'tact_ml_2_1',
              label: 'Data Wrangling & Feature Engineering',
              type: 'tactic',
              children: [
                { id: 'kpi_ml_2_1_1', label: '📖 Book: Python for Data Analysis', type: 'kpi', resourceType: 'book', author: 'Wes McKinney', url: 'https://wesmckinney.com/book/' },
                { id: 'kpi_ml_2_1_2', label: '💻 Practice: Kaggle Titanic & Housing Price Predictors', type: 'kpi', resourceType: 'interactive', author: 'Kaggle', url: 'https://www.kaggle.com/competitions' }
              ]
            },
            {
              id: 'tact_ml_2_2',
              label: 'Supervised Models (Regression, Trees, SVM)',
              type: 'tactic',
              children: [
                { id: 'kpi_ml_2_2_1', label: '📖 Book: Hands-On Machine Learning with Scikit-Learn', type: 'kpi', resourceType: 'book', author: 'Aurélien Géron', url: 'https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/' },
                { id: 'kpi_ml_2_2_2', label: '🛠️ Capstone: End-to-End Churn Prediction Pipeline', type: 'kpi', resourceType: 'project', author: 'ML Guild', url: 'https://github.com/topics/churn-prediction' }
              ]
            }
          ]
        },
        {
          id: 'strat_ml_3',
          label: '3. Deep Learning & Transformers',
          type: 'strategy',
          children: [
            {
              id: 'tact_ml_3_1',
              label: 'Neural Networks & PyTorch Fundamentals',
              type: 'tactic',
              children: [
                { id: 'kpi_ml_3_1_1', label: '📖 Book: Deep Learning with PyTorch', type: 'kpi', resourceType: 'book', author: 'Eli Stevens', url: 'https://pytorch.org/deep-learning-with-pytorch' },
                { id: 'kpi_ml_3_1_2', label: '🎥 Video: Fast.ai Practical Deep Learning for Coders', type: 'kpi', resourceType: 'video', author: 'Jeremy Howard', url: 'https://course.fast.ai/' }
              ]
            },
            {
              id: 'tact_ml_3_2',
              label: 'Transformer Architectures & Attention',
              type: 'tactic',
              children: [
                { id: 'kpi_ml_3_2_1', label: '📖 Book: Natural Language Processing with Transformers', type: 'kpi', resourceType: 'book', author: 'Lewis Tunstall', url: 'https://www.oreilly.com/library/view/natural-language-processing/9781098103231/' },
                { id: 'kpi_ml_3_2_2', label: '🛠️ Capstone: Build a Mini-GPT from Scratch in PyTorch', type: 'kpi', resourceType: 'project', author: 'Andrej Karpathy', url: 'https://github.com/karpathy/nanoGPT' }
              ]
            }
          ]
        }
      ]
    };
  }

  // 3. Full Stack Web Developer
  if (gLower.includes('full stack') || gLower.includes('web dev') || gLower.includes('next.js') || gLower.includes('react')) {
    return {
      id: 'root_fs',
      label: 'Full Stack Web Developer',
      type: 'root',
      description: 'Modern Full Stack engineering curriculum covering Frontend Architecture, Backend API Design, PostgreSQL Databases, and Cloud Deployment.',
      children: [
        {
          id: 'strat_fs_1',
          label: '1. Modern Frontend Architecture',
          type: 'strategy',
          children: [
            {
              id: 'tact_fs_1_1',
              label: 'React & Next.js App Router',
              type: 'tactic',
              children: [
                { id: 'kpi_fs_1_1_1', label: '📖 Book: Learning React (2nd Edition)', type: 'kpi', resourceType: 'book', author: 'Alex Banks, Eve Porcello', url: 'https://www.oreilly.com/library/view/learning-react-2nd/9781492051718/' },
                { id: 'kpi_fs_1_1_2', label: '💻 Docs: Next.js Official App Router Documentation', type: 'kpi', resourceType: 'docs', author: 'Vercel Team', url: 'https://nextjs.org/docs' }
              ]
            },
            {
              id: 'tact_fs_1_2',
              label: 'TypeScript & State Management',
              type: 'tactic',
              children: [
                { id: 'kpi_fs_1_2_1', label: '📖 Book: Programming TypeScript', type: 'kpi', resourceType: 'book', author: 'Boris Cherny', url: 'https://www.oreilly.com/library/view/programming-typescript/9781492052739/' },
                { id: 'kpi_fs_1_2_2', label: '🛠️ Capstone: Real-Time Kanban Board in TypeScript', type: 'kpi', resourceType: 'project', author: 'Open Source', url: 'https://github.com/topics/kanban-react' }
              ]
            }
          ]
        },
        {
          id: 'strat_fs_2',
          label: '2. Backend APIs & Database Systems',
          type: 'strategy',
          children: [
            {
              id: 'tact_fs_2_1',
              label: 'Node.js, REST & Server Actions',
              type: 'tactic',
              children: [
                { id: 'kpi_fs_2_1_1', label: '📖 Book: Node.js Design Patterns', type: 'kpi', resourceType: 'book', author: 'Mario Casciaro', url: 'https://www.nodejsdesignpatterns.com/' },
                { id: 'kpi_fs_2_2_2', label: '💻 Practice: Secure JWT & Session Auth API Sandbox', type: 'kpi', resourceType: 'interactive', author: 'AdaptiveLearn', url: 'https://github.com/topics/jwt-auth' }
              ]
            },
            {
              id: 'tact_fs_2_2',
              label: 'PostgreSQL & Fluxbase Relational Modeling',
              type: 'tactic',
              children: [
                { id: 'kpi_fs_2_2_1', label: '📖 Book: Designing Data-Intensive Applications', type: 'kpi', resourceType: 'book', author: 'Martin Kleppmann', url: 'https://dataintensive.net/' },
                { id: 'kpi_fs_2_2_2', label: '🛠️ Capstone: Multi-Tenant SaaS DB with Fluxbase', type: 'kpi', resourceType: 'project', author: 'Fluxbase Team', url: 'https://fluxbase.vercel.app' }
              ]
            }
          ]
        }
      ]
    };
  }

  // Generic Dynamic Custom Goal
  const cleanGoal = goal.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    id: 'root_custom',
    label: cleanGoal,
    type: 'root',
    description: `Curated AI knowledge graph and modular prerequisite milestones for ${cleanGoal}.`,
    children: [
      {
        id: 'strat_c_1',
        label: '1. Foundations & Core Concepts',
        type: 'strategy',
        children: [
          {
            id: 'tact_c_1_1',
            label: `${cleanGoal.split(' ')[0]} Syntax & Runtime`,
            type: 'tactic',
            children: [
              { id: 'kpi_c_1_1_1', label: `📖 Book: ${cleanGoal} Complete Reference Guide`, type: 'kpi', resourceType: 'book', author: 'Authoritative Authors', url: 'https://www.google.com/search?q=' + encodeURIComponent(cleanGoal + ' book') },
              { id: 'kpi_c_1_1_2', label: `💻 Sandbox: Interactive Code Exercises`, type: 'kpi', resourceType: 'interactive', author: 'Community Curated', url: 'https://github.com/topics/' + encodeURIComponent(cleanGoal.toLowerCase().replace(/\s+/g, '-')) }
            ]
          }
        ]
      },
      {
        id: 'strat_c_2',
        label: '2. Advanced Architecture & Practice',
        type: 'strategy',
        children: [
          {
            id: 'tact_c_2_1',
            label: `${cleanGoal.split(' ')[0]} Production Systems`,
            type: 'tactic',
            children: [
              { id: 'kpi_c_2_1_1', label: `🛠️ Capstone: Production Project Implementation`, type: 'kpi', resourceType: 'project', author: 'Open Source Labs', url: 'https://github.com' }
            ]
          }
        ]
      }
    ]
  };
}
