import { NextRequest, NextResponse } from 'next/server';
import { bedrock } from '@/lib/aws/bedrock';
import { costGuard } from '@/lib/ai/cost_guard';
import { fluxbase } from '@/lib/db/fluxbase';

export async function POST(req: NextRequest) {
  try {
    const { messages, userId = 'usr_demo_101', modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0' } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    await costGuard.checkBudget(userId);

    // Fetch live user context from Fluxbase for grounding (Anti-Hallucination)
    const profile = await fluxbase.getProfile(userId);
    const roadmap = await fluxbase.getActiveRoadmap(userId);
    const activeItem = roadmap?.items.find(i => i.status === 'in_progress');
    const completedItems = roadmap?.items.filter(i => i.status === 'completed') || [];

    const userContextStr = `
CURRENT LEARNER STATE (GROUND TRUTH FROM FLUXBASE DATABASE):
- User ID: ${userId}
- Goal / Target Role: ${profile?.target_goal || 'AI Application Engineer'}
- Available Hours/Week: ${profile?.available_hours_per_week || 14} hrs
- Preferred Learning Style: ${profile?.preferred_learning_style || 'hands-on'}
- Current Active Focus: ${activeItem ? `${activeItem.skill_name} (Phase ${activeItem.phase}: ${activeItem.phase_title})` : 'None in progress'}
- Completed Modules: ${completedItems.length > 0 ? completedItems.map(i => i.skill_name).join(', ') : 'None yet'}
- Total Roadmap Progress: ${roadmap ? `${Math.round((completedItems.length / Math.max(1, roadmap.items.length)) * 100)}%` : '0%'}
`;

    const systemPrompt = `You are the personalized AI Learning Mentor on AWS Bedrock.
You have access to the verified learner database above.
RULES:
1. Always ground your advice strictly in the learner's actual current focus and completed topics.
2. If the user asks "What should I study today?", tell them their exact current active module (${activeItem ? activeItem.skill_name : 'the first milestone'}), suggest a concrete 45-60 minute study agenda, and explain why it's the right next step.
3. If the user asks for concept explanations, explain clearly with intuitive analogies and practical code snippets.
4. If the user feels overwhelmed or wants to skip, advise them on prerequisite dependencies or recommend adapting their path.
5. Always maintain a motivating, intellectually rigorous, and structured engineering tone.`;

    const lastMessage = messages[messages.length - 1].content;
    const conversationPrompt = `${userContextStr}\n\nUSER QUESTION: ${lastMessage}`;

    const response = await bedrock.invokeText(conversationPrompt, {
      systemPrompt,
      modelId,
      userId
    });

    await costGuard.logUsage({
      userId,
      endpoint: 'assistant/chat',
      model: response.modelId,
      provider: response.provider,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      estimatedCostUsd: response.costUsd,
      latencyMs: response.latencyMs
    });

    return NextResponse.json({
      reply: response.result,
      provider: response.provider,
      model: response.modelId,
      costUsd: response.costUsd,
      latencyMs: response.latencyMs
    });
  } catch (error) {
    console.error('Error in AI Assistant chat API:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process AI mentor chat' },
      { status: 500 }
    );
  }
}
