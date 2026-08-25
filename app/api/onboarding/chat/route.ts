import { NextRequest, NextResponse } from 'next/server';
import { bedrock } from '@/lib/aws/bedrock';
import { costGuard } from '@/lib/ai/cost_guard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId = 'usr_demo_101' } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;
    const conversationLength = messages.filter((m: Message) => m.role === 'user').length;

    let systemPrompt = `You are the empathetic, expert AI Onboarding Guide for a Personalized Learning Platform.
Your goal is to converse naturally with the learner to gather:
1. Target role or goal (e.g. AI Engineer, Fullstack, ML Engineer)
2. Current experience & background skills (e.g. knows Python, beginner in ML)
3. Available study time per week (e.g. 10, 15, 20 hrs)
4. Preferred learning style (hands-on projects, visual videos, deep documentation)
5. Target timeline (e.g. 3-6 months)

Ask ONE or TWO engaging questions at a time. Be warm, motivating, and concise.`;

    let reply = '';
    let isReadyToExtract = false;

    if (conversationLength >= 3) {
      isReadyToExtract = true;
    }

    // Call Bedrock text invocation
    const response = await bedrock.invokeText(lastMessage, {
      systemPrompt,
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      userId
    });

    reply = response.result;

    // Log usage
    await costGuard.logUsage({
      userId,
      endpoint: 'onboarding/chat',
      model: response.modelId,
      provider: response.provider,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      estimatedCostUsd: response.costUsd,
      latencyMs: response.latencyMs
    });

    return NextResponse.json({
      reply,
      isReadyToExtract,
      conversationTurn: conversationLength,
      provider: response.provider,
      model: response.modelId
    });
  } catch (error) {
    console.error('Error in onboarding chat API:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process onboarding chat' },
      { status: 500 }
    );
  }
}
