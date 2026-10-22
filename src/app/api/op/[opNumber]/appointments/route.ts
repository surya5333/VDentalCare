import { NextResponse } from 'next/server';
import { apiAppointmentRepository } from '@/repositories/apiAppointmentRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  try {
    const { opNumber } = await params;
    const appointments = await apiAppointmentRepository.getAppointments(opNumber);
    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const body = await request.json();
    
    // Domain separation test: reject fields belonging to OP or FinalizedTreatment
    const forbiddenFields = [
      'patientName', 'age', 'sex', 'phone', 'reference', 'paidStatus', // OP
      'crownType', 'crownTypeId', 'numberOfCrowns', 'lab', 
      'patientPrice', 'patientPriceSnapshot', 'treatmentId', 
      'treatmentPlanData', 'teethNotation', 'visitTeethNotation'
    ];
    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        return NextResponse.json({ error: `Cannot modify domain data (${field}) through Appointment API` }, { status: 400 });
      }
    }

    const newAppointment = await apiAppointmentRepository.createAppointment(opNumber, body);
    return NextResponse.json(newAppointment, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
