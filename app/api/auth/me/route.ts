import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check cookie or authorization header
    let userId = req.cookies.get('auth_user_id')?.value;

    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        userId = authHeader.replace('Bearer ', '').trim();
      }
    }

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const res = await fluxbase.executeSql<{
      id: string;
      name: string;
      email: string;
      role: string;
      created_at: string;
    }>(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1;',
      [userId]
    );

    if (!res.success || res.rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: res.rows[0] });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
