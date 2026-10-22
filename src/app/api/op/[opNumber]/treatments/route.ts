import { NextResponse } from 'next/server';
import { apiTreatmentRepository } from '@/repositories/apiTreatmentRepository';
import { authorize, isAuthError } from '@/lib/authorize';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  try {
    const { opNumber } = await params;
    
    // Data isolation: reject Ortho OPs
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (op && op.workflowType === 'ORTHO') {
      return NextResponse.json({ error: 'Ortho OPs do not use General treatments' }, { status: 400 });
    }
    
    const treatments = await apiTreatmentRepository.getFinalizedTreatments(opNumber);
    return NextResponse.json(treatments);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    
    // Data isolation: reject Ortho OPs
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (op && op.workflowType === 'ORTHO') {
      return NextResponse.json({ error: 'Ortho OPs do not use General treatments' }, { status: 400 });
    }
    
    const body = await request.json();
    const newTreatment = await apiTreatmentRepository.addFinalizedTreatment(opNumber, body);
    return NextResponse.json(newTreatment, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

