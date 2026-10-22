import { NextResponse } from 'next/server';
import { apiLabRepository } from '@/repositories/apiLabRepository';
import { authorize, isAuthError } from '@/lib/authorize';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  try {
    const { opNumber } = await params;
    
    // Data isolation: Ortho OPs don't use lab workflow
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (op && op.workflowType === 'ORTHO') {
      return NextResponse.json({ error: 'Ortho OPs do not use the lab workflow' }, { status: 400 });
    }
    
    const records = await apiLabRepository.getLabRecordsByOp(opNumber);
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const body = await request.json();

    // Domain separation: reject frontend-supplied financial data
    const forbiddenFields = [
      'labPrice', 'labPriceSnapshot', 'labCost', 'labCostSnapshot',
      'patientPrice', 'patientPriceSnapshot', 'numberOfCrowns', 'crownType'
    ];
    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        return NextResponse.json(
          { error: `Cannot supply ${field} - backend derives this from the database` },
          { status: 400 }
        );
      }
    }

    if (!body.finalizedTreatmentId || !body.labId) {
      return NextResponse.json(
        { error: 'finalizedTreatmentId and labId are required' },
        { status: 400 }
      );
    }

    const record = await apiLabRepository.createLabRecord(opNumber, body);
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
