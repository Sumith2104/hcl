import { NextRequest, NextResponse } from 'next/server';
import { bedrock } from '@/lib/aws/bedrock';
import { costGuard } from '@/lib/ai/cost_guard';
import { fluxbase } from '@/lib/db/fluxbase';
import { agenticEngine } from '@/lib/ai/agent_executor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_demo_101';
    const conversationId = `conv_mentor_${userId}`;

    const history = await fluxbase.getChatHistory(userId, conversationId);

    return NextResponse.json({
      success: true,
      messages: history.map(h => ({
        role: h.role,
        content: h.content,
        created_at: h.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching mentor chat history:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId = 'usr_demo_101', modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0' } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const conversationId = `conv_mentor_${userId}`;
    const lastUserTurn = messages.filter((m: any) => m.role === 'user').pop();

    // Persist user turn to Fluxbase
    if (lastUserTurn) {
      await fluxbase.saveChatMessage({
        userId,
        conversationId,
        role: 'user',
        content: lastUserTurn.content
      }).catch(err => console.warn('Failed to save user mentor message:', err));
    }

    await costGuard.checkBudget(userId);

    // Fetch live user context from Fluxbase for grounding (Anti-Hallucination)
    const profile = await fluxbase.getProfile(userId);
    const roadmap = await fluxbase.getActiveRoadmap(userId);
    const activeItem = roadmap?.items.find(i => i.status === 'in_progress');
    const completedItems = roadmap?.items.filter(i => i.status === 'completed') || [];

    let reply = '';
    let toolCalls: any[] = [];
    let provider = 'agentic_aws_bedrock';
    let latencyMs = 210;
    let costUsd = 0.003;

    // Check if AWS Bedrock client has live AWS credentials
    if (bedrock.isLiveConfigured()) {
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

      reply = response.result;
      provider = response.provider;
      latencyMs = response.latencyMs;
      costUsd = response.costUsd;
    } else {
      // Execute Agentic Engine with live Fluxbase database tool access
      const agenticRes = await agenticEngine.executeMentorAgent(messages, userId);
      reply = agenticRes.reply;
      toolCalls = agenticRes.toolCalls;
    }

    // Persist assistant reply to Fluxbase
    if (reply) {
      await fluxbase.saveChatMessage({
        userId,
        conversationId,
        role: 'assistant',
        content: reply,
        metadata: { modelId, provider, activeMilestone: activeItem?.skill_name }
      }).catch(err => console.warn('Failed to save mentor reply message:', err));
    }

    await costGuard.logUsage({
      userId,
      endpoint: 'assistant/chat',
      model: modelId,
      provider: 'aws_bedrock',
      inputTokens: 220,
      outputTokens: 310,
      estimatedCostUsd: costUsd,
      latencyMs
    });

    return NextResponse.json({
      reply,
      telemetry: {
        model: modelId,
        provider,
        costUsd,
        latencyMs,
        groundedInFluxbase: true,
        activeMilestone: activeItem ? activeItem.skill_name : null,
        toolCalls
      }
    });
  } catch (error) {
    console.error('Error in AI Mentor chat API:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process chat' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_demo_101';
    const conversationId = `conv_mentor_${userId}`;

    await fluxbase.clearChatHistory(userId, conversationId);

    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing mentor chat history:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
