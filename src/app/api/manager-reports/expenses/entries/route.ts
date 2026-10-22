import { NextResponse } from 'next/server';
import { apiExpenseEntryRepository } from '@/repositories/apiExpenseEntryRepository';
import { authorize, isAuthError } from '@/lib/authorize';
import { ExpenseCategory } from '@prisma/client';

export async function POST(request: Request) {
  const auth = await authorize(['MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = await request.json();
    
    if (!body.category || !Object.values(ExpenseCategory).includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!body.expenseDate || isNaN(Date.parse(body.expenseDate))) {
      return NextResponse.json({ error: "Invalid expenseDate" }, { status: 400 });
    }
    if (!body.nameOrDescription) {
      return NextResponse.json({ error: "Name/description is required" }, { status: 400 });
    }

    const cashAmount = typeof body.cashAmount === 'number' ? body.cashAmount : 0;
    const bankAmount = typeof body.bankAmount === 'number' ? body.bankAmount : 0;

    if (cashAmount < 0 || bankAmount < 0) {
      return NextResponse.json({ error: "Expense amounts cannot be negative" }, { status: 400 });
    }

    const entry = await apiExpenseEntryRepository.createEntry({
      category: body.category as ExpenseCategory,
      expenseDate: new Date(body.expenseDate),
      nameOrDescription: body.nameOrDescription,
      cashAmount,
      bankAmount,
      notes: body.notes,
      createdBy: auth.session.username,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
