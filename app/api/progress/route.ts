import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_demo_101';
    const progress = await fluxbase.getProgress(userId);
    return NextResponse.json({ progress });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'usr_demo_101',
      roadmapItemId,
      completionPercentage,
      assessmentScore,
      timeSpentHours = 1,
      feedback,
      status = 'completed'
    } = body;

    if (!roadmapItemId) {
      return NextResponse.json({ error: 'roadmapItemId is required' }, { status: 400 });
    }

    const saved = await fluxbase.recordProgress({
      id: `prog_${Date.now()}`,
      user_id: userId,
      roadmap_item_id: roadmapItemId,
      completion_percentage: completionPercentage ?? 100,
      assessment_score: assessmentScore,
      time_spent_hours: timeSpentHours,
      feedback,
      status,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, progress: saved });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
