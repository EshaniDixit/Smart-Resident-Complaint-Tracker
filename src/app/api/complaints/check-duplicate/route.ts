import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth';
import { findDuplicates } from '@/lib/classify';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await req.json();
    if (!description || description.trim().length < 10) {
      return NextResponse.json({ duplicates: [] });
    }

    // Fetch all existing unresolved complaints from any resident.
    // We intentionally include the user's own OPEN/IN_PROGRESS complaints —
    // if you already filed this and it's being handled, we should tell you.
    // Only RESOLVED complaints are excluded (that issue is closed).
    const existing = await db.complaint.findMany({
      where: {
        status: { not: 'RESOLVED' }, // resolved issues aren't worth warning about
      },
      select: {
        id: true,
        description: true,
        summary: true,
        status: true,
        category: true,
        urgency: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const duplicates = findDuplicates(description, existing);

    return NextResponse.json({ duplicates });
  } catch (error) {
    console.error('[POST /api/complaints/check-duplicate]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
