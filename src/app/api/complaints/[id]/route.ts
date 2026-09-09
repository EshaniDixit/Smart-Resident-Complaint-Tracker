import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();
    const { id } = await params;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const complaint = await db.complaint.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error('[PUT /api/complaints/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
