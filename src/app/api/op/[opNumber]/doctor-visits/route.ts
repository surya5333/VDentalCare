import { NextResponse } from 'next/server';
import { apiDoctorVisitRepository } from '@/repositories/apiDoctorVisitRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  try {
    const { opNumber } = await params;
    const visits = await apiDoctorVisitRepository.getVisits(opNumber);
    return NextResponse.json(visits);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const body = await request.json();
    
    // Domain separation: reject fields belonging to FinalizedTreatment or lab
    const forbiddenFields = [
      'crownType', 'crownTypeId', 'numberOfCrowns', 'lab', 
      'patientPrice', 'patientPriceSnapshot', 'treatmentId', 
      'treatmentPlanData', 'teethNotation', 'egEhsGen'
    ];
    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        return NextResponse.json({ error: `Cannot modify finalized treatment data (${field}) through Doctor Visit API` }, { status: 400 });
      }
    }

    const newVisit = await apiDoctorVisitRepository.createVisit(opNumber, body);
    return NextResponse.json(newVisit, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
