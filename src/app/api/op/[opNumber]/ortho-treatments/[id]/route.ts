import { NextResponse } from 'next/server';
import { apiOrthoTreatmentRepository } from '@/repositories/apiOrthoTreatmentRepository';
import { authorize, isAuthError } from '@/lib/authorize';
import { prisma } from '@/lib/prisma';

async function getOrthoOpRecord(opNumber: string) {
  const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
  if (!op || op.workflowType !== 'ORTHO') return null;
  return op;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opNumber: string, id: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber, id } = await params;
    const body = await request.json();
    
    const op = await getOrthoOpRecord(opNumber);
    if (!op) {
      return NextResponse.json({ error: 'Valid Ortho OP not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.treatmentName) updateData.treatmentName = body.treatmentName;
    if (body.treatmentCode) updateData.treatmentCode = body.treatmentCode;
    if (body.amount !== undefined) {
      const amount = parseInt(body.amount, 10);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
      }
      updateData.amount = amount;
    }

    const updated = await apiOrthoTreatmentRepository.update(id, updateData);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ opNumber: string, id: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber, id } = await params;
    
    const op = await getOrthoOpRecord(opNumber);
    if (!op) {
      return NextResponse.json({ error: 'Valid Ortho OP not found' }, { status: 404 });
    }

    // Verify the treatment belongs to this OP
    const treatments = await apiOrthoTreatmentRepository.getByOpId(op.id);
    const treatment = treatments.find(t => t.id === id);
    if (!treatment) {
      return NextResponse.json({ error: 'Ortho treatment not found for this OP' }, { status: 404 });
    }

    await apiOrthoTreatmentRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
