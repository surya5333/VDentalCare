import { NextResponse } from 'next/server';
import { apiLabExpensePaymentRepository } from '@/repositories/apiLabExpensePaymentRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function PUT(request: Request) {
  const auth = await authorize(['MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = await request.json();
    const { labId, month } = body;

    if (!labId || typeof labId !== 'string') {
      return NextResponse.json({ error: "Missing or invalid labId" }, { status: 400 });
    }

    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Missing or invalid month (must be YYYY-MM)" }, { status: 400 });
    }

    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    if (isNaN(monthStart.getTime())) {
      return NextResponse.json({ error: "Invalid date format for month" }, { status: 400 });
    }

    if (body.cashPaid !== undefined && (typeof body.cashPaid !== 'number' || body.cashPaid < 0)) {
      return NextResponse.json({ error: "Cash paid must be a non-negative number" }, { status: 400 });
    }

    if (body.bankPaid !== undefined && (typeof body.bankPaid !== 'number' || body.bankPaid < 0)) {
      return NextResponse.json({ error: "Bank paid must be a non-negative number" }, { status: 400 });
    }

    const cashPaid = typeof body.cashPaid === 'number' ? Math.round(body.cashPaid) : 0;
    const bankPaid = typeof body.bankPaid === 'number' ? Math.round(body.bankPaid) : 0;

    const payment = await apiLabExpensePaymentRepository.upsertLabMonthlyPayment(
      labId,
      monthStart,
      {
        cashPaid,
        bankPaid,
        updatedBy: auth.session.username
      }
    );

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error("Error updating lab monthly payment:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
