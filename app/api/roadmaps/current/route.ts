import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';
import { orchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_demo_101';

    let roadmap = await fluxbase.getActiveRoadmap(userId);
    const profile = await fluxbase.getProfile(userId);

    if (!roadmap) {
      // Auto-generate initial roadmap if profile exists
      if (profile) {
        roadmap = await orchestrator.generatePersonalizedRoadmap(userId, profile);
      }
    }

    const progress = await fluxbase.getProgress(userId);
    const totalItems = roadmap ? roadmap.items.length : 0;
    const completedItems = roadmap ? roadmap.items.filter(i => i.status === 'completed').length : 0;
    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return NextResponse.json({
      roadmap,
      profile,
      progress,
      stats: {
        totalItems,
        completedItems,
        completionRate,
        totalHours: roadmap ? roadmap.total_hours : 0,
        currentPhase: roadmap && roadmap.items.find(i => i.status === 'in_progress')?.phase || 1
      }
    });
  } catch (error) {
    console.error('Error fetching current roadmap:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch roadmap' },
      { status: 500 }
    );
  }
}
