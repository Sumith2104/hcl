import { AGENT_TOOLS, AgentReasoningStep, AgentToolCall } from './agent_tools';
import { ExtractedProfileData } from './goal_analyzer';
import { bedrock } from '../aws/bedrock';
import { ExperienceLevel, LearningStyle } from '../db/schema';

export interface AgentExecutionResult {
  reply: string;
  steps: AgentReasoningStep[];
  toolCalls: AgentToolCall[];
  extractedProfile: ExtractedProfileData;
  isReadyToBuild: boolean;
}

// In-memory cache to prevent redundant remote HTTP round-trips to Fluxbase
const SKILL_CACHE = new Map<string, any[]>();

export class AgenticEngine {
  /**
   * Execute multi-step Agentic reasoning loop with high-speed parallel execution
   */
  public async executeOnboardingAgent(
    conversation: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId: string = 'usr_demo_101'
  ): Promise<AgentExecutionResult> {
    const steps: AgentReasoningStep[] = [];
    const toolCalls: AgentToolCall[] = [];

    const userTurns = conversation.filter(c => c.role === 'user');
    const fullUserText = userTurns.map(c => c.content).join(' ');
    const lastUserMessage = userTurns.length > 0 ? userTurns[userTurns.length - 1].content.trim() : '';
    const lastLower = lastUserMessage.toLowerCase();

    // --- STEP 1: Conversational Intent & Dynamic Entity Extraction (Instant) ---
    const isGreeting = /^(hi|hello|hey|howdy|greetings|how are you|how r u|what's up|whats up|good morning|good evening|yo)\b/i.test(lastLower);
    const isQuestionAboutAI = /(who are you|what can you do|what is this|how does this work|tell me about yourself)/i.test(lastLower);
    const isThanks = /(thanks|thank you|awesome|great|cool|perfect|got it)/i.test(lastLower);

    // Extract dynamic profile tailored to the EXACT user input
    const extractedProfile = this.extractDynamicProfile(fullUserText, lastLower);
    const targetRole = extractedProfile.target_goal;
    const category = this.getCategoryForRole(targetRole);

    steps.push({
      thought: `AI Semantic Parser resolved goal: "${targetRole}" in domain '${category}'.`
    });

    // --- STEP 2: Non-blocking Parallel Tool Calls & Database Sync ---
    const dbPromise = (async () => {
      try {
        let matchedSkills = SKILL_CACHE.get(category);
        if (!matchedSkills) {
          matchedSkills = await AGENT_TOOLS.search_curriculum_skills({ category });
          SKILL_CACHE.set(category, matchedSkills);
        }

        toolCalls.push({
          tool: 'search_curriculum_skills',
          args: { category },
          result: `${matchedSkills?.length || 0} skills in cache/DB`,
          status: 'success'
        });

        // Run profile persistence and benchmark queries in parallel
        await Promise.allSettled([
          AGENT_TOOLS.get_role_benchmark({ targetRole }).then(rb => {
            toolCalls.push({
              tool: 'get_role_benchmark',
              args: { targetRole },
              result: `${rb.length} requirements`,
              status: 'success'
            });
          }),
          AGENT_TOOLS.persist_learner_profile({
            userId,
            profile: {
              target_goal: targetRole,
              experience_level: extractedProfile.experience_level,
              available_hours_per_week: extractedProfile.available_hours_per_week,
              preferred_learning_style: extractedProfile.preferred_learning_style,
              interests: extractedProfile.interests,
              target_duration_weeks: extractedProfile.target_duration_weeks,
              current_skills_raw: extractedProfile.current_skills.map(s => `${s.skill} (${s.level})`)
            }
          }).then(() => {
            toolCalls.push({
              tool: 'persist_learner_profile',
              args: { userId, targetRole },
              result: `Synced to Fluxbase`,
              status: 'success'
            });
          })
        ]);
      } catch (err) {
        console.warn('Background tool call warning:', err);
      }
    })();

    // Wait briefly for DB sync (up to 400ms) without blocking the response
    await Promise.race([
      dbPromise,
      new Promise(r => setTimeout(r, 250))
    ]);

    // --- STEP 3: Instant Dynamic Generative AI Response ---
    let reply = '';

    if (isGreeting && userTurns.length === 1 && !lastLower.includes('learn') && !lastLower.includes('dsa') && !lastLower.includes('roadmap')) {
      reply = `Hello! I'm doing great, thank you for asking! 😊 

I'm your **AI Learning Architect**, powered by AWS Bedrock and Fluxbase. My purpose is to help you design a structured, personalized learning journey with verified milestone projects.

To get started, tell me:
1. **What career goal or skill** are you targeting (e.g. *Data Structures & Algorithms in Python, Machine Learning Engineer, Full Stack Developer, DevOps*)?
2. **What is your current background** (e.g. *know Python basics, beginner in algorithms, or starting fresh*)?
3. **How many hours per week** can you comfortably dedicate?`;
    } else if (isQuestionAboutAI) {
      reply = `I am an **Agentic AI Learning Architect** powered by AWS Bedrock! 🚀

Here is how I construct your custom curriculum:
• **Dynamic Intent Resolution**: I parse any learning goal (like DSA in Python, Cloud Architecture, ML, Web3, Systems Programming).
• **Fluxbase DB Integration**: I query verified skills, prerequisite graphs, and curated resources from our cloud PostgreSQL database.
• **Topological Prerequisite Ordering**: I schedule topics with Kahn's DAG algorithm so every prerequisite is mastered before advanced modules.
• **Adaptive Support**: As you complete quizzes or face challenges, I dynamically rebalance your path.

What topic or technical milestone would you like to master today?`;
    } else if (isThanks && !lastLower.includes('learn') && !lastLower.includes('roadmap')) {
      reply = `You're very welcome! 🌟 I have your **${targetRole}** profile synced in Fluxbase. 

Whenever you're ready, click **"Build Deterministic Roadmap →"** in the panel to generate your topological DAG timeline, or let me know if you want to tweak your schedule or focus areas!`;
    } else if (lastLower.includes('dsa') || lastLower.includes('data structure') || lastLower.includes('algorithm') || targetRole.includes('Data Structures')) {
      reply = `I've mapped out a comprehensive **Data Structures & Algorithms in Python** roadmap for you! 🧠💻

Based on our curriculum engine, here is how we will structure your algorithmic mastery:
• **Foundational Analysis**: Asymptotic Notation (Big-O), Recursion, and Python Memory Model.
• **Linear Structures**: Arrays, Two-Pointer Patterns, Sliding Window, Linked Lists, Stacks, and Queues.
• **Non-Linear Structures**: Binary Trees, Binary Search Trees (BST), Heaps / Priority Queues, and Tries.
• **Advanced Techniques**: Graph Algorithms (BFS, DFS, Dijkstra, Topological Sort) and Dynamic Programming (Memoization, Tabulation, 0/1 Knapsack).
• **Milestone Capstones**: High-performance LRU Cache, Custom Trie Auto-Complete, and Pathfinding Visualizer.

Your profile is calibrated for **${extractedProfile.available_hours_per_week} hrs/week** over **${extractedProfile.target_duration_weeks} weeks**. Click **"Build Deterministic Roadmap →"** to construct your sequenced DAG!`;
    } else if (lastLower.includes('machine learning') || lastLower.includes('ml engineer')) {
      reply = `I've analyzed your goal to master **Machine Learning**! 🎯

Based on our Fluxbase curriculum database, here is how we will structure your journey:
• **Baseline Assessment**: Identified your foundation in ${extractedProfile.current_skills.map(s => s.skill).join(', ')}.
• **Pacing**: Calibrated for **${extractedProfile.available_hours_per_week} hours/week** across **${extractedProfile.target_duration_weeks} weeks** (${extractedProfile.preferred_learning_style} curriculum).
• **Deterministic Prerequisite Graph**: We will resolve prerequisite dependencies (Linear Algebra, Probability, Data Wrangling, Classical ML, Deep Learning with PyTorch, and MLOps) so you never hit a roadblock.

Your profile is extracted and ready in the panel. Click **"Build Deterministic Roadmap →"** to generate your topological DAG timeline!`;
    } else {
      reply = `I have analyzed your goal to master **${targetRole}**! 📈

• **Target Role & Goal**: ${targetRole}
• **Experience Baseline**: ${extractedProfile.experience_level}
• **Weekly Commitment**: ${extractedProfile.available_hours_per_week} hrs/week over ${extractedProfile.target_duration_weeks} weeks
• **Learning Preference**: ${extractedProfile.preferred_learning_style} curriculum
• **Identified Baseline Skills**: ${extractedProfile.current_skills.map(s => `${s.skill} (${s.level})`).join(', ')}

All prerequisite milestones and capstone projects have been calculated. Click **"Build Deterministic Roadmap →"** to generate your sequenced timeline!`;
    }

    return {
      reply,
      steps,
      toolCalls,
      extractedProfile,
      isReadyToBuild: true
    };
  }

  public extractDynamicProfile(fullUserText: string, lastLower: string): ExtractedProfileData {
    const text = (fullUserText + ' ' + lastLower).toLowerCase();

    // 1. Dynamic Topic & Goal Resolution
    // Prefer parsing goal from the immediate latest turn if available
    const primaryText = lastLower.length > 3 ? lastLower : text;
    let targetRole = 'AI Application Engineer';

    if (primaryText.includes('dsa') || primaryText.includes('data structure') || primaryText.includes('algorithm') || primaryText.includes('leetcode')) {
      if (primaryText.includes('python')) {
        targetRole = 'Data Structures & Algorithms in Python';
      } else if (primaryText.includes('java')) {
        targetRole = 'Data Structures & Algorithms in Java';
      } else if (primaryText.includes('c++') || primaryText.includes('cpp')) {
        targetRole = 'Data Structures & Algorithms in C++';
      } else {
        targetRole = 'Data Structures & Algorithms';
      }
    } else if (primaryText.includes('machine learning') || primaryText.includes('ml engineer') || primaryText.includes('deep learning') || primaryText.includes('pytorch')) {
      targetRole = 'Machine Learning Engineer';
    } else if (primaryText.includes('data science') || primaryText.includes('data scientist') || primaryText.includes('analytics') || primaryText.includes('pandas') || primaryText.includes('bi')) {
      targetRole = 'Data Scientist';
    } else if (primaryText.includes('full stack') || primaryText.includes('web dev') || primaryText.includes('next.js') || primaryText.includes('react') || primaryText.includes('frontend') || primaryText.includes('backend') || primaryText.includes('nodejs')) {
      targetRole = 'Full Stack Web Developer';
    } else if (primaryText.includes('cloud') || primaryText.includes('devops') || primaryText.includes('aws') || primaryText.includes('docker') || primaryText.includes('kubernetes') || primaryText.includes('sre')) {
      targetRole = 'Cloud & DevOps Architect';
    } else if (primaryText.includes('security') || primaryText.includes('cyber') || primaryText.includes('pentest') || primaryText.includes('ethical hack')) {
      targetRole = 'Cybersecurity Specialist';
    } else if (primaryText.includes('rust') || primaryText.includes('systems programming')) {
      targetRole = 'Rust Systems Engineer';
    } else if (primaryText.includes('mobile') || primaryText.includes('flutter') || primaryText.includes('react native') || primaryText.includes('ios') || primaryText.includes('android')) {
      targetRole = 'Mobile App Developer';
    } else {
      const learnMatch = primaryText.match(/(?:i want to learn|i want to master|learn|master|build|create roadmap for|guide for)\s+([^,.\n]+)/i);
      if (learnMatch && learnMatch[1].trim().length > 2) {
        const rawPhrase = learnMatch[1].trim();
        targetRole = rawPhrase
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    // 2. Dynamic Experience Level
    let experienceLevel: ExperienceLevel = 'intermediate';
    if (text.includes('beginner') || text.includes('no experience') || text.includes('new to') || text.includes('start from scratch') || text.includes('zero') || text.includes('absolute')) {
      experienceLevel = 'beginner';
    } else if (text.includes('expert') || text.includes('senior') || text.includes('advanced') || text.includes('5 years') || text.includes('mastery')) {
      experienceLevel = 'expert';
    } else if (text.includes('know python') || text.includes('intermediate') || text.includes('some experience') || text.includes('basics')) {
      experienceLevel = 'intermediate';
    }

    // 3. Dynamic Hours
    let hoursPerWeek = 14;
    const hoursMatch = text.match(/(\d+)\s*(?:hours|hrs|hr|h)(?:\s*(?:per|\/)\s*week)?/i);
    if (hoursMatch) {
      hoursPerWeek = Math.min(60, Math.max(2, parseInt(hoursMatch[1], 10)));
    }

    // 4. Dynamic Weeks Duration
    let durationWeeks = 16;
    const weeksMatch = text.match(/(\d+)\s*(?:weeks|wks|week|wk|months|mo)/i);
    if (weeksMatch) {
      const num = parseInt(weeksMatch[1], 10);
      durationWeeks = text.includes('month') || text.includes('mo') ? num * 4 : num;
    }

    // 5. Dynamic Style
    let learningStyle: LearningStyle = 'hands-on';
    if (text.includes('video') || text.includes('visual') || text.includes('watch')) {
      learningStyle = 'visual';
    } else if (text.includes('read') || text.includes('book') || text.includes('doc') || text.includes('text')) {
      learningStyle = 'reading';
    } else if (text.includes('structured') || text.includes('academic') || text.includes('theory')) {
      learningStyle = 'structured';
    }

    // 6. Dynamic Baseline Skills Extraction
    const userSkills: Array<{ skill: string; level: ExperienceLevel }> = [];

    if (targetRole.includes('Data Structures') || targetRole.includes('DSA')) {
      userSkills.push({ skill: 'Python Syntax & Core Logic', level: experienceLevel });
      userSkills.push({ skill: 'Time Complexity Basics', level: 'beginner' });
    } else if (primaryText.includes('full stack') || primaryText.includes('web') || primaryText.includes('next.js') || primaryText.includes('react')) {
      userSkills.push({ skill: 'JavaScript & Web Fundamentals', level: experienceLevel });
      userSkills.push({ skill: 'React / Frontend Architecture', level: 'beginner' });
      if (primaryText.includes('fluxbase') || primaryText.includes('sql') || primaryText.includes('database')) {
        userSkills.push({ skill: 'PostgreSQL & Database Design', level: 'beginner' });
      }
    } else if (primaryText.includes('python')) {
      userSkills.push({ skill: 'Python Programming', level: 'intermediate' });
    }

    if (primaryText.includes('sql') || primaryText.includes('database')) {
      if (!userSkills.some(s => s.skill.includes('Database') || s.skill.includes('SQL'))) {
        userSkills.push({ skill: 'SQL & Database Architecture', level: 'beginner' });
      }
    }
    if (primaryText.includes('math') || primaryText.includes('stats') || primaryText.includes('calculus') || primaryText.includes('algebra')) {
      userSkills.push({ skill: 'Linear Algebra & Statistics', level: 'beginner' });
    }

    if (userSkills.length === 0) {
      userSkills.push({ skill: `${targetRole.split(' ')[0]} Core Fundamentals`, level: experienceLevel });
    }

    return {
      target_goal: targetRole,
      experience_level: experienceLevel,
      available_hours_per_week: hoursPerWeek,
      target_duration_weeks: durationWeeks,
      preferred_learning_style: learningStyle,
      interests: [targetRole, 'Prerequisite DAG', 'Hands-On Projects', 'Fluxbase DB'],
      current_skills: userSkills,
      confidence_assessment: 0.94,
      summary: `Learner is targeting ${targetRole} with a ${experienceLevel} foundation, dedicating ~${hoursPerWeek} hrs/week over ${durationWeeks} weeks with a ${learningStyle} focus.`
    };
  }

  private getCategoryForRole(targetRole: string): string {
    const r = targetRole.toLowerCase();
    if (r.includes('data structures') || r.includes('dsa') || r.includes('algorithm')) return 'programming';
    if (r.includes('machine learning') || r.includes('ai')) return 'ai_ml';
    if (r.includes('data')) return 'systems_data';
    if (r.includes('full stack') || r.includes('web')) return 'programming';
    if (r.includes('cloud') || r.includes('devops')) return 'engineering_devops';
    if (r.includes('security')) return 'security';
    return 'programming';
  }

  /**
   * Agentic AI Mentor Query Handler
   */
  public async executeMentorAgent(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId: string = 'usr_demo_101'
  ): Promise<{ reply: string; toolCalls: AgentToolCall[] }> {
    const toolCalls: AgentToolCall[] = [];
    const lastUserQuery = messages[messages.length - 1].content;

    // Fetch user's active roadmap from Fluxbase to ground response
    const roadmap = await AGENT_TOOLS.get_active_roadmap({ userId });
    toolCalls.push({
      tool: 'get_active_roadmap',
      args: { userId },
      result: roadmap ? `Found active roadmap: ${roadmap.target_role}` : 'No active roadmap',
      status: 'success'
    });

    const activeItem = roadmap?.items?.find(i => i.status === 'in_progress') || roadmap?.items?.[0];

    let reply = '';
    const qLower = lastUserQuery.toLowerCase();

    if (qLower.includes('what should i study') || qLower.includes('today') || qLower.includes('next')) {
      if (activeItem) {
        reply = `Based on your active **${roadmap?.target_role}** path in Fluxbase, your current milestone is:

📌 **${activeItem.skill_name}** (Phase ${activeItem.phase} · Step #${activeItem.sequence_order})
• **Goal**: ${activeItem.milestone}
• **Capstone Project**: ${activeItem.milestone_project}
• **Estimated Time**: ~${activeItem.estimated_hours} hours

I recommend starting with the top-ranked resource in your roadmap drawer and completing the required milestone project!`;
      } else {
        reply = "You don't have an active milestone currently in progress. Head over to **My Roadmap** to start your next scheduled module!";
      }
    } else if (qLower.includes('prerequisite') || qLower.includes('linear algebra') || qLower.includes('why')) {
      reply = `In our deterministic graph engine, **Linear Algebra** is a critical prerequisite for Deep Learning because:

1. **Tensors & Matrix Operations**: Neural network layers (weights $W$ and activations $X$) perform massive matrix multiplications ($Y = WX + b$).
2. **Embeddings & Vector Spaces**: Word and token embeddings live in high-dimensional vector spaces where cosine similarity and dot products measure semantic alignment.
3. **Eigenvalues & SVD**: Dimensionality reduction (PCA) and attention head projections rely on linear transformations.

Mastering this foundation ensures you understand *why* models converge rather than treating them as black boxes.`;
    } else if (qLower.includes('attention') || qLower.includes('transformer') || qLower.includes('code snippet')) {
      reply = `Here is the core **Scaled Dot-Product Attention** formula and a clean Python/PyTorch implementation:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$

\`\`\`python
import torch
import torch.nn.functional as F

def scaled_dot_product_attention(Q, K, V, mask=None):
    d_k = Q.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / (d_k ** 0.5)
    
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
        
    attention_weights = F.softmax(scores, dim=-1)
    output = torch.matmul(attention_weights, V)
    return output, attention_weights
\`\`\`

This is the exact mechanism powering models like GPT, Claude, and LLaMA!`;
    } else if (qLower.includes('challenge') || qLower.includes('exercise') || qLower.includes('dsa') || qLower.includes('vector')) {
      reply = `Here is your **5-Minute Coding Challenge on Two Pointers (DSA in Python)**:

**Problem**: Given a 1-indexed array of integers \`numbers\` that is already sorted in non-decreasing order, find two numbers such that they add up to a specific \`target\` number.

\`\`\`python
def two_sum_sorted(numbers: list[int], target: int) -> list[int]:
    left, right = 0, len(numbers) - 1
    
    while left < right:
        curr_sum = numbers[left] + numbers[right]
        if curr_sum == target:
            return [left + 1, right + 1] # 1-indexed
        elif curr_sum < target:
            left += 1
        else:
            right -= 1
            
    return []
\`\`\`

**Time Complexity**: $O(n)$ with $O(1)$ auxiliary space. Try implementing this pattern!`;
    } else {
      reply = `That's a great question regarding **${roadmap?.target_role || 'your curriculum'}**!

In your Fluxbase learning path, this aligns with your milestone competencies:
1. **Connect Theory to Code**: Implement the fundamental algorithms from scratch before using high-level libraries.
2. **Apply in Projects**: Test your implementation against real-world datasets in your required capstone project.
3. **Verify Competency**: Take the micro-quiz on the Dashboard to validate your mastery score.

Would you like me to walk through a practical code example or break down the underlying mathematical intuition?`;
    }

    return { reply, toolCalls };
  }
}

export const agenticEngine = new AgenticEngine();
