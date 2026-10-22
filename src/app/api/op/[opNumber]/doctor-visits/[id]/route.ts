import { NextResponse } from 'next/server';
import { apiDoctorVisitRepository } from '@/repositories/apiDoctorVisitRepository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string, id: string }> }
) {
  try {
    const { id } = await params;
    const visit = await apiDoctorVisitRepository.getVisitById(id);
    return NextResponse.json(visit);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opNumber: string, id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Domain separation test: reject fields belonging to FinalizedTreatment or lab
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

    const updated = await apiDoctorVisitRepository.updateVisit(id, body);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
