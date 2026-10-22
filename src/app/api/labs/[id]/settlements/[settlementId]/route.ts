import { NextResponse } from 'next/server';
import { apiLabSettlementRepository } from '@/repositories/apiLabSettlementRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; settlementId: string }> }
) {
  try {
    const { settlementId } = await params;
    const settlement = await apiLabSettlementRepository.getSettlementById(settlementId);
    return NextResponse.json(settlement);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; settlementId: string }> }
) {
  const auth = await authorize(['CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { settlementId } = await params;
    const body = await request.json();
    const updated = await apiLabSettlementRepository.updateSettlement(settlementId, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
