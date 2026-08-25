import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';
import { verifyPassword } from '@/lib/auth/auth-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user by email from Fluxbase
    const res = await fluxbase.executeSql<{
      id: string;
      name: string;
      email: string;
      role: string;
      password_hash: string;
      created_at: string;
    }>(
      'SELECT id, name, email, role, password_hash, created_at FROM users WHERE LOWER(email) = $1 LIMIT 1;',
      [cleanEmail]
    );

    if (!res.success || res.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const userRow = res.rows[0];

    // Verify password
    if (userRow.password_hash) {
      const isValid = verifyPassword(password, userRow.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      created_at: userRow.created_at
    };

    const response = NextResponse.json({
      success: true,
      user
    });

    // Set auth cookie
    response.cookies.set('auth_user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: (error as Error).message || 'Login failed' }, { status: 500 });
  }
}
