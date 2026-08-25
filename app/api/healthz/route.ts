import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'personalized-learning-saas',
    uptime_seconds: process.uptime()
  });
}
