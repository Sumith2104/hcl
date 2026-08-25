import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';
import { BEDROCK_MODELS } from '@/lib/aws/models';
import { bedrock } from '@/lib/aws/bedrock';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_demo_101';

    const { totalUsd, totalTokens, logs } = await fluxbase.getMonthlySpend(userId);
    const allLogs = await fluxbase.getAllUsageLogs();
    const bedrockStatus = bedrock.getStatus();

    const totalSystemUsd = allLogs.reduce((acc, l) => acc + l.estimated_cost_usd, 0);
    const totalSystemTokens = allLogs.reduce((acc, l) => acc + l.input_tokens + l.output_tokens, 0);
    const avgLatency = allLogs.length > 0 ? Math.round(allLogs.reduce((acc, l) => acc + l.latency_ms, 0) / allLogs.length) : 0;

    return NextResponse.json({
      bedrockStatus,
      userMetrics: {
        userId,
        monthlySpendUsd: totalUsd,
        budgetCeilingUsd: 10.00,
        budgetRemainingUsd: Math.max(0, 10.00 - totalUsd),
        totalTokens,
        recentLogs: logs.slice(-10).reverse()
      },
      systemMetrics: {
        totalCalls: allLogs.length,
        totalSystemUsd,
        totalSystemTokens,
        avgLatencyMs: avgLatency,
        models: Object.values(BEDROCK_MODELS)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
