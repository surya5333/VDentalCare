import { NextResponse } from 'next/server';
import { apiCatalogueRepository } from '@/repositories/apiCatalogueRepository';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await apiCatalogueRepository.updateReference(id, body);
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
    const deleted = await apiCatalogueRepository.deleteReference(id);
    return NextResponse.json(deleted);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
