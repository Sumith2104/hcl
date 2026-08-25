import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';
import { hashPassword } from '@/lib/auth/auth-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await fluxbase.executeSql<{ id: string }>(
      'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1;',
      [cleanEmail]
    );

    if (existing.success && existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pwdHash = hashPassword(password);

    // Insert user into Fluxbase
    const insertRes = await fluxbase.executeSql(
      'INSERT INTO users (id, name, email, role, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, NOW());',
      [userId, name.trim(), cleanEmail, 'learner', pwdHash]
    );

    if (!insertRes.success) {
      throw new Error(insertRes.error || 'Failed to create user in database.');
    }

    // Initialize default profile linked to the user
    await fluxbase.executeSql(
      `INSERT INTO learner_profiles (id, user_id, target_goal, experience_level, available_hours_per_week, preferred_learning_style, interests, target_duration_weeks, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING;`,
      [
        `prof_${userId}`,
        userId,
        'AI Application Engineer',
        'intermediate',
        14,
        'hands-on',
        'AI Engineering, LLMs, Cloud Systems',
        16
      ]
    );

    const user = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role: 'learner',
      created_at: new Date().toISOString()
    };

    const response = NextResponse.json({
      success: true,
      user
    });

    // Set auth cookie
    response.cookies.set('auth_user_id', userId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json({ error: (error as Error).message || 'Signup failed' }, { status: 500 });
  }
}
