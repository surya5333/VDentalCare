import { NextResponse } from 'next/server';
import { apiLabExpensePaymentRepository } from '@/repositories/apiLabExpensePaymentRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function PUT(request: Request, { params }: { params: Promise<{ labRecordId: string }> }) {
  const auth = await authorize(['MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { labRecordId } = await params;
    const body = await request.json();
    
    if (body.cashPaid !== undefined && body.cashPaid < 0) {
      return NextResponse.json({ error: "Payment amounts cannot be negative" }, { status: 400 });
    }
    if (body.bankPaid !== undefined && body.bankPaid < 0) {
      return NextResponse.json({ error: "Payment amounts cannot be negative" }, { status: 400 });
    }

    const cashPaid = typeof body.cashPaid === 'number' ? body.cashPaid : 0;
    const bankPaid = typeof body.bankPaid === 'number' ? body.bankPaid : 0;

    const payment = await apiLabExpensePaymentRepository.upsertPayment(labRecordId, {
      cashPaid,
      bankPaid,
      updatedBy: auth.session.username
    });
    
    return NextResponse.json(payment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
