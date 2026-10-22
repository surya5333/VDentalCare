import { NextResponse } from 'next/server';
import { apiExpenseEntryRepository } from '@/repositories/apiExpenseEntryRepository';
import { authorize, isAuthError } from '@/lib/authorize';
import { ExpenseCategory } from '@prisma/client';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(['MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.cashAmount !== undefined && body.cashAmount < 0) {
      return NextResponse.json({ error: "Expense amounts cannot be negative" }, { status: 400 });
    }
    if (body.bankAmount !== undefined && body.bankAmount < 0) {
      return NextResponse.json({ error: "Expense amounts cannot be negative" }, { status: 400 });
    }

    const updateData: any = { updatedBy: auth.session.username };
    
    if (body.category && Object.values(ExpenseCategory).includes(body.category)) {
      updateData.category = body.category as ExpenseCategory;
    }
    if (body.expenseDate && !isNaN(Date.parse(body.expenseDate))) {
      updateData.expenseDate = new Date(body.expenseDate);
    }
    if (body.nameOrDescription) updateData.nameOrDescription = body.nameOrDescription;
    if (body.cashAmount !== undefined) updateData.cashAmount = body.cashAmount;
    if (body.bankAmount !== undefined) updateData.bankAmount = body.bankAmount;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const entry = await apiExpenseEntryRepository.updateEntry(id, updateData);
    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(['MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { id } = await params;
    await apiExpenseEntryRepository.deleteEntry(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
