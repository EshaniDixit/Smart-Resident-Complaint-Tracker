import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password, role, adminCode } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (role !== 'ADMIN' && role !== 'RESIDENT') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Admin registration requires a valid invite code
    if (role === 'ADMIN') {
      const expectedCode = process.env.ADMIN_INVITE_CODE;
      if (!expectedCode || adminCode !== expectedCode) {
        return NextResponse.json(
          { error: 'Invalid admin invite code' },
          { status: 403 }
        );
      }
    }

    const existingUser = await db.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        username,
        passwordHash,
        role
      }
    });

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    const response = NextResponse.json({ success: true, user: { id: user.id, username, role } });

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day — matches JWT expiry
    });

    return response;
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
