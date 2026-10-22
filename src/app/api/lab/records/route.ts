import { NextResponse } from 'next/server';
import { apiLabRepository } from '@/repositories/apiLabRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(request: Request) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const labId = searchParams.get('labId') || undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;

    const records = await apiLabRepository.getAllLabRecords(labId, month, year);
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
