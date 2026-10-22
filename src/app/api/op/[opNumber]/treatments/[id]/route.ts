import { NextResponse } from 'next/server';
import { apiTreatmentRepository } from '@/repositories/apiTreatmentRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opNumber: string, id: string }> }
) {
  const auth = await authorize(['CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await apiTreatmentRepository.updateFinalizedTreatment(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ opNumber: string, id: string }> }
) {
  const auth = await authorize(['CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    await apiTreatmentRepository.deleteFinalizedTreatment(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
