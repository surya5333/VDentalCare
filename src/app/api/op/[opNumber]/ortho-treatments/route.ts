import { NextResponse } from 'next/server';
import { apiOrthoTreatmentRepository } from '@/repositories/apiOrthoTreatmentRepository';
import { authorize, isAuthError } from '@/lib/authorize';
import { prisma } from '@/lib/prisma';

async function getOrthoOpRecord(opNumber: string) {
  const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
  if (!op) return null;
  if (op.workflowType !== 'ORTHO') return null;
  return op;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD', 'WORKING_DOCTOR', 'MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const op = await getOrthoOpRecord(opNumber);
    if (!op) {
      return NextResponse.json({ error: 'Valid Ortho OP not found' }, { status: 404 });
    }

    const records = await apiOrthoTreatmentRepository.getByOpId(op.id);
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const body = await request.json();
    
    const op = await getOrthoOpRecord(opNumber);
    if (!op) {
      return NextResponse.json({ error: 'Valid Ortho OP not found' }, { status: 404 });
    }

    if (!body.treatmentName || !body.treatmentCode || !body.amount) {
      return NextResponse.json({ error: 'treatmentName, treatmentCode, and amount are required' }, { status: 400 });
    }

    const amount = parseInt(body.amount, 10);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }

    const newTreatment = await apiOrthoTreatmentRepository.create({
      opRecordId: op.id,
      treatmentName: body.treatmentName,
      treatmentCode: body.treatmentCode,
      amount
    });

    return NextResponse.json(newTreatment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
