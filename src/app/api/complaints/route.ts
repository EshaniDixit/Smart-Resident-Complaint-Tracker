import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth';
import { classifyComplaint, generateSummary } from '@/lib/classify';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let complaints;
    
    if (user.role === 'ADMIN') {
      complaints = await db.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        include: { resident: { select: { username: true } } }
      });
    } else {
      complaints = await db.complaint.findMany({
        where: { residentId: user.id },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error('[GET /api/complaints]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Always classify server-side — guaranteed accuracy regardless of client AI state
    const { category, urgency, aiResponse } = classifyComplaint(description);
    const summary = generateSummary(description);

    const complaint = await db.complaint.create({
      data: {
        description,
        summary,
        category,
        urgency,
        aiResponse,
        residentId: user.id
      }
    });

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error('[POST /api/complaints]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
