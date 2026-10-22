import { NextResponse } from 'next/server';
import { apiOPRepository } from '@/repositories/apiOPRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(request: Request) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD', 'WORKING_DOCTOR', 'MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const doctorId = searchParams.get('doctorId') || undefined;

    const records = await apiOPRepository.findAll('ORTHO', { query, doctorId });
    return NextResponse.json(records);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
