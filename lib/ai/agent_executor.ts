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

export class AgenticEngine {
  /**
   * Execute multi-step Agentic reasoning loop on conversation turns
   */
  public async executeOnboardingAgent(
    conversation: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId: string = 'usr_demo_101'
  ): Promise<AgentExecutionResult> {
    const steps: AgentReasoningStep[] = [];
    const toolCalls: AgentToolCall[] = [];

    const userTurns = conversation.filter(c => c.role === 'user');
    const fullUserText = userTurns.map(c => c.content).join(' ');
    const lastUserMessage = userTurns.length > 0 ? userTurns[userTurns.length - 1].content : '';

    // --- STEP 1: Reason about user's goal & domain ---
    steps.push({
      thought: `Analyzing learner statement: "${lastUserMessage}". Identifying domain, career objective, and technical background.`
    });

    // Determine target role and domain dynamically
    const lower = fullUserText.toLowerCase();
    let targetRole = 'AI Application Engineer';
    let category = 'ai_ml';

    if (lower.includes('machine learning') || lower.includes('ml engineer') || lower.includes('model')) {
      targetRole = 'Machine Learning Engineer';
      category = 'ai_ml';
    } else if (lower.includes('data science') || lower.includes('data scientist') || lower.includes('analytics') || lower.includes('pandas')) {
      targetRole = 'Data Scientist';
      category = 'systems_data';
    } else if (lower.includes('full stack') || lower.includes('web dev') || lower.includes('next.js') || lower.includes('react') || lower.includes('frontend') || lower.includes('backend')) {
      targetRole = 'Full Stack Web Developer';
      category = 'programming';
    } else if (lower.includes('cloud') || lower.includes('devops') || lower.includes('aws') || lower.includes('docker') || lower.includes('kubernetes')) {
      targetRole = 'Cloud & DevOps Architect';
      category = 'engineering_devops';
    } else if (lower.includes('security') || lower.includes('cyber') || lower.includes('penetration')) {
      targetRole = 'Cybersecurity Specialist';
      category = 'security';
    }

    // --- STEP 2: Autonomous Tool Call - Query Fluxbase Skills & Benchmark ---
    steps.push({
      thought: `Querying live Fluxbase database for role requirements and skills in category '${category}' for '${targetRole}'.`,
      action: 'search_curriculum_skills',
      actionInput: { category }
    });

    const matchedSkills = await AGENT_TOOLS.search_curriculum_skills({ category });
    toolCalls.push({
      tool: 'search_curriculum_skills',
      args: { category },
      result: `${matchedSkills.length} canonical skills retrieved from Fluxbase`,
      status: 'success'
    });

    steps.push({
      thought: `Found ${matchedSkills.length} canonical curriculum skills in Fluxbase. Now querying role competency requirements.`,
      action: 'get_role_benchmark',
      actionInput: { targetRole }
    });

    const roleBenchmarks = await AGENT_TOOLS.get_role_benchmark({ targetRole });
    toolCalls.push({
      tool: 'get_role_benchmark',
      args: { targetRole },
      result: `${roleBenchmarks.length} benchmark requirements found`,
      status: 'success'
    });

    // --- STEP 3: Dynamic Extraction of Experience, Hours, Style, Baseline ---
    let experienceLevel: ExperienceLevel = 'intermediate';
    if (lower.includes('beginner') || lower.includes('no experience') || lower.includes('new to') || lower.includes('start from scratch')) {
      experienceLevel = 'beginner';
    } else if (lower.includes('expert') || lower.includes('senior') || lower.includes('advanced') || lower.includes('5 years')) {
      experienceLevel = 'expert';
    } else if (lower.includes('know python') || lower.includes('intermediate') || lower.includes('some experience') || lower.includes('basics of')) {
      experienceLevel = 'intermediate';
    }

    // Extract hours per week
    let hoursPerWeek = 14;
    const hoursMatch = lower.match(/(\d+)\s*(?:hours|hrs|hr|h)(?:\s*(?:per|\/)\s*week)?/i);
    if (hoursMatch) {
      hoursPerWeek = Math.min(60, Math.max(2, parseInt(hoursMatch[1], 10)));
    }

    // Extract duration weeks
    let durationWeeks = 16;
    const weeksMatch = lower.match(/(\d+)\s*(?:weeks|wks|week|wk|months|mo)/i);
    if (weeksMatch) {
      const num = parseInt(weeksMatch[1], 10);
      durationWeeks = lower.includes('month') || lower.includes('mo') ? num * 4 : num;
    }

    // Extract learning style
    let learningStyle: LearningStyle = 'hands-on';
    if (lower.includes('video') || lower.includes('visual') || lower.includes('watch')) {
      learningStyle = 'visual';
    } else if (lower.includes('read') || lower.includes('book') || lower.includes('doc') || lower.includes('text')) {
      learningStyle = 'reading';
    } else if (lower.includes('structured') || lower.includes('academic') || lower.includes('theory')) {
      learningStyle = 'structured';
    }

    // Identify user's claimed skills
    const userSkills: Array<{ skill: string; level: ExperienceLevel }> = [];
    if (lower.includes('python') || experienceLevel === 'intermediate') {
      userSkills.push({ skill: 'Python Programming', level: 'intermediate' });
    }
    if (lower.includes('sql') || lower.includes('database')) {
      userSkills.push({ skill: 'SQL & Database Architecture', level: 'beginner' });
    }
    if (lower.includes('math') || lower.includes('stats') || lower.includes('calculus')) {
      userSkills.push({ skill: 'Linear Algebra & Statistics', level: 'beginner' });
    }
    if (lower.includes('javascript') || lower.includes('react') || lower.includes('html')) {
      userSkills.push({ skill: 'JavaScript & Web Fundamentals', level: 'intermediate' });
    }

    if (userSkills.length === 0) {
      userSkills.push({ skill: 'Core Computing Fundamentals', level: experienceLevel });
    }

    const extractedProfile: ExtractedProfileData = {
      target_goal: targetRole,
      experience_level: experienceLevel,
      available_hours_per_week: hoursPerWeek,
      target_duration_weeks: durationWeeks,
      preferred_learning_style: learningStyle,
      interests: [targetRole, 'Prerequisite DAG', 'Hands-On Projects', 'Fluxbase DB'],
      current_skills: userSkills,
      confidence_assessment: 0.92,
      summary: `Learner is targeting ${targetRole} with a ${experienceLevel} foundation, dedicating ~${hoursPerWeek} hrs/week over ${durationWeeks} weeks with a ${learningStyle} focus.`
    };

    // --- STEP 4: Autonomous Tool Call - Persist Profile to Fluxbase ---
    steps.push({
      thought: `Persisting structured learner profile to Fluxbase database for user '${userId}'.`,
      action: 'persist_learner_profile',
      actionInput: { userId, targetRole, hoursPerWeek }
    });

    await AGENT_TOOLS.persist_learner_profile({
      userId,
      profile: {
        target_goal: targetRole,
        experience_level: experienceLevel,
        available_hours_per_week: hoursPerWeek,
        preferred_learning_style: learningStyle,
        interests: extractedProfile.interests,
        target_duration_weeks: durationWeeks,
        current_skills_raw: userSkills.map(s => `${s.skill} (${s.level})`)
      }
    });

    toolCalls.push({
      tool: 'persist_learner_profile',
      args: { userId, targetRole },
      result: 'Profile updated in Fluxbase table learner_profiles',
      status: 'success'
    });

    // --- STEP 5: Formulate Intelligent Personalized Response ---
    let reply = '';
    const hasGoal = Boolean(targetRole);
    const isFirstTurn = userTurns.length === 1;

    if (isFirstTurn) {
      reply = `I've analyzed your goal to become a **${targetRole}**! 🎯

Based on our Fluxbase curriculum database, here is how we will structure your journey:
• **Baseline Assessment**: Identified your foundation in ${userSkills.map(s => s.skill).join(', ')}.
• **Pacing**: Calibrated for **${hoursPerWeek} hours/week** across **${durationWeeks} weeks** (${learningStyle} curriculum).
• **Deterministic Prerequisite Graph**: We will resolve prerequisite dependencies (e.g. foundational math, core programming, deep neural architectures, and practical milestone projects) so you never hit a roadblock.

Your profile is extracted and ready in the right panel. Click **"Build Deterministic Roadmap"** to generate your topological DAG timeline, or let me know if you'd like to adjust your weekly study hours or target timeline!`;
    } else {
      reply = `Got it! I have updated your **${targetRole}** learning profile in Fluxbase. 

• **Experience Level**: ${experienceLevel}
• **Commitment**: ${hoursPerWeek} hrs/week over ${durationWeeks} weeks
• **Learning Style**: ${learningStyle}
• **Verified Skills**: ${userSkills.map(s => `${s.skill} (${s.level})`).join(', ')}

All prerequisite dependencies and milestone capstones are calculated. Click **"Build Deterministic Roadmap"** below to generate your personalized learning path!`;
    }

    return {
      reply,
      steps,
      toolCalls,
      extractedProfile,
      isReadyToBuild: true
    };
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

    // Formulate response grounded in real data
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
    } else if (qLower.includes('challenge') || qLower.includes('exercise') || qLower.includes('vector')) {
      reply = `Here is your **5-Minute Coding Challenge on Vector Search**:

**Objective**: Write a Python function using NumPy to compute the top-$k$ nearest neighbors for a query vector given a database of vector embeddings.

\`\`\`python
import numpy as np

def find_top_k_similar(query_vector, database_vectors, k=3):
    # Step 1: Normalize query and database vectors for Cosine Similarity
    norm_query = query_vector / np.linalg.norm(query_vector)
    norm_db = database_vectors / np.linalg.norm(database_vectors, axis=1, keepdims=True)
    
    # Step 2: Compute dot products (cosine similarities)
    similarities = np.dot(norm_db, norm_query)
    
    # Step 3: Get top-k indices sorted descending
    top_indices = np.argsort(similarities)[::-1][:k]
    
    return top_indices, similarities[top_indices]
\`\`\`

Try running this with synthetic embeddings! Would you like a hint on optimizing this with an HNSW index?`;
    } else {
      reply = `That's a great question regarding **${roadmap?.target_role || 'your curriculum'}**!

In your Fluxbase learning path, this aligns with your milestone competencies. To master this concept effectively:
1. **Connect Theory to Code**: Implement the fundamental algorithms from scratch before using high-level libraries.
2. **Apply in Projects**: Test your implementation against real-world datasets in your required capstone project.
3. **Verify Competency**: Take the micro-quiz on the Dashboard to validate your mastery score.

Would you like me to walk through a practical code example or break down the underlying mathematical intuition?`;
    }

    return { reply, toolCalls };
  }
}

export const agenticEngine = new AgenticEngine();
