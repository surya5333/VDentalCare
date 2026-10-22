import { NextResponse } from 'next/server';
import { apiLabSettlementRepository } from '@/repositories/apiLabSettlementRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settlements = await apiLabSettlementRepository.getSettlements(id);
    return NextResponse.json(settlements);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorize(['CLINIC_HEAD', 'FRONT_OFFICE']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    let settlement;
    if (body.items && body.items.length > 0) {
      settlement = await apiLabSettlementRepository.createSettlement(id, body);
    } else {
      settlement = await apiLabSettlementRepository.createMonthlySettlement(id, body);
    }
    return NextResponse.json(settlement, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
