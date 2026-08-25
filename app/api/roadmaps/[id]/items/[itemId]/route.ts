import { NextRequest, NextResponse } from 'next/server';
import { fluxbase } from '@/lib/db/fluxbase';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { status } = await req.json();
    const { id: roadmapId, itemId } = params;

    if (!status || !['locked', 'in_progress', 'completed', 'skipped'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    const updatedItem = await fluxbase.updateRoadmapItemStatus(roadmapId, itemId, status);
    if (!updatedItem) {
      return NextResponse.json({ error: 'Roadmap or Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating roadmap item:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update item' },
      { status: 500 }
    );
  }
}
