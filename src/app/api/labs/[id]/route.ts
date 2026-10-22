import { NextResponse } from 'next/server';
import { apiLabRepository } from '@/repositories/apiLabRepository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    // Return summary + records for this lab
    const [summary, records] = await Promise.all([
      apiLabRepository.getLabSummary(id),
      apiLabRepository.getLabRecordsByLab(
        id,
        month ? parseInt(month) : undefined,
        year ? parseInt(year) : undefined
      )
    ]);

    return NextResponse.json({ summary, records });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await apiLabRepository.updateLab(id, body);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await apiLabRepository.deleteLab(id);
    return NextResponse.json(deleted);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
