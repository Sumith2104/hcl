import { NextRequest, NextResponse } from 'next/server';
import { goalAnalyzer } from '@/lib/ai/goal_analyzer';

export async function POST(req: NextRequest) {
  try {
    const { messages, userId = 'usr_demo_101' } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const extracted = await goalAnalyzer.analyzeConversation(messages, userId);
    return NextResponse.json({
      success: true,
      data: extracted
    });
  } catch (error) {
    console.error('Error in profile extraction API:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to extract profile' },
      { status: 500 }
    );
  }
}
