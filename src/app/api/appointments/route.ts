import { NextResponse } from 'next/server';
import { apiAppointmentRepository } from '@/repositories/apiAppointmentRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(request: Request) {
  const auth = await authorize(['FRONT_OFFICE', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const appointments = await apiAppointmentRepository.getAllAppointments(date);
    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
