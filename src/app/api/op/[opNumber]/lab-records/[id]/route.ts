import { NextResponse } from 'next/server';
import { apiLabRepository } from '@/repositories/apiLabRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string; id: string }> }
) {
  try {
    const { id } = await params;
    const record = await apiLabRepository.getLabRecordById(id);
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opNumber: string; id: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await apiLabRepository.updateLabRecord(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
