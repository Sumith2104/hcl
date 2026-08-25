import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get('skillId') || 'ai_ml_foundations';

    let quiz = await fluxbase.getQuizForSkill(skillId);
    if (!quiz) {
      // Return default python quiz as fallback
      quiz = await fluxbase.getQuizForSkill('prog_python');
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { skillId, answers, userId = 'usr_demo_101', roadmapItemId } = await req.json();

    const quiz = (await fluxbase.getQuizForSkill(skillId)) || (await fluxbase.getQuizForSkill('prog_python'));
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    let correctCount = 0;
    const feedbackDetails = quiz.questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correct_index;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        isCorrect,
        correctIndex: q.correct_index,
        explanation: q.explanation
      };
    });

    const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePercentage >= 70;

    // Record assessment result in progress
    if (roadmapItemId) {
      await fluxbase.recordProgress({
        id: `prog_quiz_${Date.now()}`,
        user_id: userId,
        roadmap_item_id: roadmapItemId,
        completion_percentage: passed ? 100 : 50,
        assessment_score: scorePercentage,
        time_spent_hours: 0.5,
        status: passed ? 'completed' : 'in_progress',
        updated_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      scorePercentage,
      passed,
      correctCount,
      totalQuestions: quiz.questions.length,
      feedbackDetails
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
