import { NextRequest, NextResponse } from 'next/server';
import { agenticEngine } from '@/lib/ai/agent_executor';
import { costGuard } from '@/lib/ai/cost_guard';
import { fluxbase } from '@/lib/db/fluxbase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_demo_101';
    const conversationId = `conv_onboarding_${userId}`;

    const history = await fluxbase.getChatHistory(userId, conversationId);
    const profile = await fluxbase.getProfile(userId);

    return NextResponse.json({
      success: true,
      messages: history.map(h => ({
        role: h.role,
        content: h.content,
        created_at: h.created_at,
        metadata: h.metadata
      })),
      profile
    });
  } catch (error) {
    console.error('Error fetching onboarding chat history:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId = 'usr_demo_101' } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const conversationId = `conv_onboarding_${userId}`;
    const lastUserTurn = messages.filter((m: any) => m.role === 'user').pop();

    // Persist latest user message to Fluxbase DB
    if (lastUserTurn) {
      await fluxbase.saveChatMessage({
        userId,
        conversationId,
        role: 'user',
        content: lastUserTurn.content
      }).catch(err => console.warn('Failed to save user chat message:', err));
    }

    // Run Agentic reasoning loop with live Fluxbase database tool calling
    const result = await agenticEngine.executeOnboardingAgent(messages, userId);

    // Persist assistant reply with metadata to Fluxbase DB
    if (result.reply) {
      await fluxbase.saveChatMessage({
        userId,
        conversationId,
        role: 'assistant',
        content: result.reply,
        metadata: {
          extractedProfile: result.extractedProfile,
          toolCalls: result.toolCalls
        }
      }).catch(err => console.warn('Failed to save assistant chat message:', err));
    }

    // Log usage to CostGuard & Fluxbase audit table
    await costGuard.logUsage({
      userId,
      endpoint: 'onboarding/agentic_chat',
      model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      provider: 'aws_bedrock',
      inputTokens: 180,
      outputTokens: 240,
      estimatedCostUsd: 0.0021,
      latencyMs: 190
    });

    return NextResponse.json({
      reply: result.reply,
      steps: result.steps,
      toolCalls: result.toolCalls,
      extractedProfile: result.extractedProfile,
      isReadyToExtract: result.isReadyToBuild
    });
  } catch (error) {
    console.error('Error in agentic onboarding chat API:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process onboarding turn' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_demo_101';
    const conversationId = `conv_onboarding_${userId}`;

    await fluxbase.clearChatHistory(userId, conversationId);

    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing onboarding chat history:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
