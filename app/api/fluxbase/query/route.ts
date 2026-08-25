import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { query = 'SELECT * FROM users LIMIT 10;', params = [] } = await req.json();

    const result = await fluxbase.executeSql(query, params);
    const status = fluxbase.getStatus();

    return NextResponse.json({
      ...result,
      status
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
