import { NextRequest, NextResponse } from 'next/server';
import { goalAnalyzer, ExtractedProfileData } from '@/lib/ai/goal_analyzer';
import { orchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const { profileData, userId = 'usr_demo_101', generateRoadmap = true } = await req.json();

    if (!profileData) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    const savedProfile = await goalAnalyzer.mapToLearnerProfile(profileData as ExtractedProfileData, userId);

    let roadmap = null;
    if (generateRoadmap) {
      roadmap = await orchestrator.generatePersonalizedRoadmap(userId, savedProfile);
    }

    return NextResponse.json({
      success: true,
      profile: savedProfile,
      roadmap
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
