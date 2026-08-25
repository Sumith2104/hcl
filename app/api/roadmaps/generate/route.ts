import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';
import { orchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const { userId = 'usr_demo_101', async = false } = await req.json();

    if (async) {
      // Create SQS-style async background job
      const job = await fluxbase.createJob({
        user_id: userId,
        job_type: 'generate_roadmap',
        status: 'queued',
        progress_percentage: 10,
        step_description: 'Analyzing career role requirements & skill gaps...'
      });

      // Launch async processing in background
      (async () => {
        try {
          await fluxbase.updateJob(job.id, {
            status: 'running',
            progress_percentage: 45,
            step_description: 'Executing topological prerequisite sort & DAG resolution...'
          });

          const roadmap = await orchestrator.generatePersonalizedRoadmap(userId);

          await fluxbase.updateJob(job.id, {
            status: 'succeeded',
            progress_percentage: 100,
            result_ref: roadmap.id,
            step_description: 'Personalized roadmap generated successfully!'
          });
        } catch (err) {
          await fluxbase.updateJob(job.id, {
            status: 'failed',
            error_message: (err as Error).message,
            step_description: 'Roadmap generation failed.'
          });
        }
      })();

      return NextResponse.json({
        job_id: job.id,
        status: 'queued',
        message: 'Roadmap generation job enqueued.'
      }, { status: 202 });
    }

    // Synchronous direct generation
    const roadmap = await orchestrator.generatePersonalizedRoadmap(userId);
    return NextResponse.json({
      success: true,
      roadmap
    });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate roadmap' },
      { status: 500 }
    );
  }
}
