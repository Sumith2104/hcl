import { NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';
import { bedrock } from '@/lib/aws/bedrock';

export async function GET() {
  try {
    const skillsCount = (await fluxbase.getAllSkills()).length;
    const bedrockInfo = bedrock.getStatus();

    return NextResponse.json({
      status: 'ready',
      database: {
        provider: 'fluxbase',
        skills_indexed: skillsCount,
        healthy: true
      },
      llm_provider: {
        service: 'AWS Bedrock',
        configured: bedrockInfo.isConfigured,
        default_model: bedrockInfo.defaultModel
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'not_ready',
      error: (error as Error).message
    }, { status: 503 });
  }
}
