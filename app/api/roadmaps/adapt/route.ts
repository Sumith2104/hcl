import { NextRequest, NextResponse } from 'next/server';
import { adaptationEngine } from '@/lib/ai/adaptation_engine';

export async function POST(req: NextRequest) {
  try {
    const {
      roadmapId,
      userId = 'usr_demo_101',
      feedbackType,
      feedbackText,
      targetSkillId,
      quizScore
    } = await req.json();

    if (!roadmapId || !feedbackType || !feedbackText) {
      return NextResponse.json(
        { error: 'roadmapId, feedbackType, and feedbackText are required' },
        { status: 400 }
      );
    }

    const result = await adaptationEngine.adaptRoadmap({
      roadmapId,
      userId,
      feedbackType,
      feedbackText,
      targetSkillId,
      quizScore
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error adapting roadmap:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to adapt roadmap' },
      { status: 500 }
    );
  }
}
