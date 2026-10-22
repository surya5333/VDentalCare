import { NextResponse } from 'next/server';
import { apiOPRepository } from '@/repositories/apiOPRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  // Only Clinic Head can classify OP as Ortho
  const auth = await authorize(['CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    let revertToGeneral = false;
    try {
      const body = await request.json();
      revertToGeneral = body.revertToGeneral === true;
    } catch {
      // Body is optional
    }

    if (revertToGeneral) {
      const reverted = await apiOPRepository.revertToGeneral(opNumber);
      return NextResponse.json(reverted);
    }

    const classified = await apiOPRepository.classifyAsOrtho(opNumber);
    if (!classified) {
      return NextResponse.json({ error: 'OP not found' }, { status: 404 });
    }
    return NextResponse.json(classified);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
