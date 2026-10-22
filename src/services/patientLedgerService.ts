import { apiPatientLedgerRepository } from '../repositories/apiPatientLedgerRepository';
import { prisma } from '@/lib/prisma';


export const VALID_PAYMENT_MODES = ["Cash", "Swipe", "Phone Pay", "UPI", "Card", "Bank Transfer"];

export const patientLedgerService = {
  getLedger: async (opNumber: string) => {
    const op = await prisma.oPRecord.findUnique({ 
      where: { opNumber },
      include: {
        finalizedTreatments: true
      }
    });
    if (!op) throw new Error("OP Record not found");
    if (op.workflowType !== 'GENERAL') throw new Error("Use Ortho ledger for Ortho patients");

    const rows = await apiPatientLedgerRepository.getLedgerByOpId(op.id, 'GENERAL');
    
    // Calculate gross treatment cost
    // patientPriceSnapshot already stores total crown cost (unit price × numberOfCrowns)
    let grossTreatmentCost = 0;
    for (const ft of op.finalizedTreatments) {
      grossTreatmentCost += ft.patientPriceSnapshot || 0;
    }

    // Calculate summary
    let totalPaid = 0;
    let totalDiscount = op.advisoryDiscount || 0;
    
    for (const row of rows) {
      if (!row.isRegistrationFee) {
        totalPaid += row.paidAmount;
      }
      totalDiscount += row.discount;
    }

    const currentBalance = grossTreatmentCost - totalDiscount - totalPaid;

    return {
      rows,
      summary: {
        totalTreatmentCost: grossTreatmentCost,
        totalPaid,
        totalDiscount,
        currentBalance
      }
    };
  },

  addTransaction: async (
    opNumber: string,
    data: {
      date: string;
      finalizedTreatmentId?: string;
      paidAmount: number;
      discount: number;
      paymentMode: string;
      idempotencyKey?: string;
    }
  ) => {
    // 0. Idempotency Check: if idempotencyKey is provided and record already exists, return it
    if (data.idempotencyKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- idempotencyKey not in generated types until prisma generate reruns
      const existing = await (prisma as any).patientLedger.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: {
          finalizedTreatment: {
            include: {
              treatment: true,
              crownType: true,
            }
          },
          orthoTreatment: true,
        }
      });
      if (existing) {
        return existing;
      }
    }

    // Basic validations
    if (data.paidAmount < 0) throw new Error("Paid amount cannot be negative");
    if (data.discount < 0) throw new Error("Discount cannot be negative");
    if (data.paidAmount === 0 && data.discount === 0) throw new Error("Transaction must have either payment or discount");
    if (!VALID_PAYMENT_MODES.includes(data.paymentMode)) throw new Error("Invalid payment mode");

    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");
    if (op.workflowType !== 'GENERAL') throw new Error("Use Ortho ledger for Ortho patients");

    try {
      // We use a transaction to ensure no concurrent writes corrupt the balance
      return await apiPatientLedgerRepository.executeTransaction(async (tx) => {
        // If concurrent request already inserted with this idempotencyKey
        if (data.idempotencyKey) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existingInTx = await (tx as any).patientLedger.findUnique({
            where: { idempotencyKey: data.idempotencyKey }
          });
          if (existingInTx) return existingInTx;
        }

        // 1. Calculate Gross Treatment Cost
        // patientPriceSnapshot already stores total crown cost (unit price × numberOfCrowns)
        const finalizedTreatments = await tx.finalizedTreatment.findMany({ where: { opRecordId: op.id } });
        let grossTreatmentCost = 0;
        for (const ft of finalizedTreatments) {
          grossTreatmentCost += ft.patientPriceSnapshot || 0;
        }

        // 2. Calculate current paid and discount
        const existingRows = await tx.patientLedger.findMany({
          where: { opRecordId: op.id, workflowType: 'GENERAL' },
          orderBy: { createdAt: 'asc' }
        });

        let totalPaid = 0;
        let totalDiscount = op.advisoryDiscount || 0;
        for (const row of existingRows) {
          if (!row.isRegistrationFee) {
            totalPaid += row.paidAmount;
          }
          totalDiscount += row.discount;
        }

        // 3. Determine current outstanding
        const currentOutstanding = grossTreatmentCost - totalDiscount - totalPaid;

        // 4. Validate against current outstanding
        if (data.discount > currentOutstanding) {
          throw new Error("Discount cannot be greater than remaining balance");
        }
        if (data.paidAmount > (currentOutstanding - data.discount)) {
          throw new Error("Payment exceeds remaining balance after discount");
        }

        const newBalance = currentOutstanding - data.paidAmount - data.discount;

        // 5. Store the new row
        return await apiPatientLedgerRepository.createLedgerRow({
          opRecordId: op.id,
          date: new Date(data.date),
          treatmentCost: currentOutstanding,
          paidAmount: data.paidAmount,
          discount: data.discount,
          paymentMode: data.paymentMode,
          balance: newBalance,
          finalizedTreatmentId: data.finalizedTreatmentId,
          workflowType: 'GENERAL',
          idempotencyKey: data.idempotencyKey,
        }, tx);
      });
    } catch (err: unknown) {
      const prismaErr = err as { code?: string; message?: string };
      // Handle unique constraint race condition on idempotencyKey
      if (data.idempotencyKey && (prismaErr.code === 'P2002' || prismaErr.message?.includes('Unique constraint'))) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await (prisma as any).patientLedger.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
          include: {
            finalizedTreatment: {
              include: {
                treatment: true,
                crownType: true,
              }
            },
            orthoTreatment: true,
          }
        });
        if (existing) return existing;
      }
      throw prismaErr;
    }
  },

  editTransaction: async (
    opNumber: string,
    transactionId: string,
    data: {
      date?: string;
      paidAmount?: number;
      discount?: number;
      paymentMode?: string;
    }
  ) => {
    if (!transactionId) throw new Error("Transaction ID is required");

    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    const existingRow = await prisma.patientLedger.findUnique({
      where: { id: transactionId },
    });
    if (!existingRow) throw new Error("Transaction not found");
    if (existingRow.opRecordId !== op.id) {
      throw new Error("Transaction does not belong to this OP record");
    }

    const newPaid = data.paidAmount !== undefined ? Number(data.paidAmount) : existingRow.paidAmount;
    const newDiscount = data.discount !== undefined ? Number(data.discount) : existingRow.discount;
    const newPaymentMode = data.paymentMode !== undefined ? data.paymentMode : existingRow.paymentMode;
    const newDate = data.date ? new Date(data.date) : existingRow.date;

    if (isNaN(newPaid) || newPaid < 0) throw new Error("Paid amount cannot be negative");
    if (isNaN(newDiscount) || newDiscount < 0) throw new Error("Discount cannot be negative");
    if (newPaid === 0 && newDiscount === 0) throw new Error("Transaction must have either payment or discount");
    if (!VALID_PAYMENT_MODES.includes(newPaymentMode)) throw new Error("Invalid payment mode");
    if (isNaN(newDate.getTime())) throw new Error("Invalid transaction date");

    return apiPatientLedgerRepository.executeTransaction(async (tx) => {
      // 1. Calculate Gross Treatment Cost
      // patientPriceSnapshot already stores total crown cost (unit price × numberOfCrowns)
      let grossCost = 0;
      let initialDiscount = 0;
      if (existingRow.workflowType === 'GENERAL') {
        const finalizedTreatments = await tx.finalizedTreatment.findMany({ where: { opRecordId: op.id } });
        for (const ft of finalizedTreatments) {
          grossCost += ft.patientPriceSnapshot || 0;
        }
        initialDiscount = op.advisoryDiscount || 0;
      } else {
        grossCost = op.orthoTotalAmount || 0;
        initialDiscount = op.orthoDiscount || 0;
      }

      // 2. Fetch all other ledger rows for this OP
      const otherRows = await tx.patientLedger.findMany({
        where: { opRecordId: op.id, workflowType: existingRow.workflowType, id: { not: transactionId } },
      });

      const otherTreatmentRows = otherRows.filter(r => !r.isRegistrationFee);
      const totalDiscountsWithUpdate = initialDiscount + otherTreatmentRows.reduce((sum, r) => sum + r.discount, 0) + newDiscount;
      
      if (!existingRow.isRegistrationFee) {
        if (totalDiscountsWithUpdate > grossCost) {
          throw new Error(`Total discount (₹${totalDiscountsWithUpdate}) cannot exceed total treatment cost (₹${grossCost})`);
        }

        const totalPaidWithUpdate = otherTreatmentRows.reduce((sum, r) => sum + r.paidAmount, 0) + newPaid;
        if (totalPaidWithUpdate > (grossCost - totalDiscountsWithUpdate)) {
          throw new Error("Total payments cannot exceed remaining balance after discount");
        }
      }

      // 3. Update this row
      await apiPatientLedgerRepository.updateLedgerRow(transactionId, {
        date: newDate,
        paidAmount: newPaid,
        discount: newDiscount,
        paymentMode: newPaymentMode,
      }, tx);

      // 4. Recalculate all balances in chronological order
      await apiPatientLedgerRepository.recalculateLedgerBalances(op.id, existingRow.workflowType, tx);

      // 5. Return updated row
      return apiPatientLedgerRepository.getLedgerRowById(transactionId, tx);
    });
  },

  deleteTransaction: async (opNumber: string, transactionId: string) => {
    if (!transactionId) throw new Error("Transaction ID is required");

    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    const existingRow = await prisma.patientLedger.findUnique({
      where: { id: transactionId },
    });
    if (!existingRow) throw new Error("Transaction not found");
    if (existingRow.opRecordId !== op.id) {
      throw new Error("Transaction does not belong to this OP record");
    }

    return apiPatientLedgerRepository.executeTransaction(async (tx) => {
      await apiPatientLedgerRepository.deleteLedgerRow(transactionId, tx);
      await apiPatientLedgerRepository.recalculateLedgerBalances(op.id, existingRow.workflowType, tx);
      return { success: true, message: "Transaction deleted successfully" };
    });
  }
};
