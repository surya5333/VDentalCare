import { NextResponse } from 'next/server';
import { authorize, isAuthError } from '@/lib/authorize';
import { prisma } from '@/lib/prisma';

/**
 * Ortho Manager Report: Cumulative/live financial report.
 * NOT monthly-based. Shows from beginning of ortho case to current.
 */
export async function GET() {
  const auth = await authorize(['MANAGER', 'CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    // 1. Get all Ortho OPs
    const orthoOps = await prisma.oPRecord.findMany({
      where: { workflowType: 'ORTHO' },
      include: {
        orthoTreatments: true,
        patientLedgers: {
          where: { workflowType: 'ORTHO' },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    let totalOrthoCost = 0;
    let totalDiscounts = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let cash = 0;
    let swipe = 0;
    let phonePay = 0;

    const patients = orthoOps.map(op => {
      // Total Ortho Cost from finalized Ortho financial amount
      const patientTotalOrthoCost = op.orthoTotalAmount || 0;

      let paid = 0;
      let ledgerDiscount = 0;
      let latestBalance = 0;

      for (const row of op.patientLedgers) {
        paid += row.paidAmount;
        ledgerDiscount += row.discount;
        latestBalance = row.balance;

        if (row.paymentMode === 'Cash') cash += row.paidAmount;
        else if (row.paymentMode === 'Swipe') swipe += row.paidAmount;
        else if (row.paymentMode === 'Phone Pay') phonePay += row.paidAmount;
      }

      // Discount from existing Ortho discount field + ledger discounts
      const totalDiscount = (op.orthoDiscount || 0) + ledgerDiscount;
      const outstanding = patientTotalOrthoCost - totalDiscount - paid;

      totalOrthoCost += patientTotalOrthoCost;
      totalDiscounts += totalDiscount;
      totalPaid += paid;
      totalOutstanding += outstanding;

      return {
        opNumber: op.opNumber,
        patientName: op.patientName,
        treatmentCount: op.orthoTreatments.length,
        totalOrthoCost: patientTotalOrthoCost,
        grossTreatmentCost: patientTotalOrthoCost,
        totalPaid: paid,
        totalDiscount,
        currentOutstanding: outstanding,
        lastLedgerBalance: latestBalance,
        transactionCount: op.patientLedgers.length,
      };
    });

    return NextResponse.json({
      reportType: 'ORTHO_CUMULATIVE',
      generatedAt: new Date().toISOString(),
      summary: {
        totalOrthoPatients: orthoOps.length,
        totalOrthoCost,
        totalTreatmentCharges: totalOrthoCost,
        totalDiscounts,
        totalPaid,
        totalOutstanding,
        collection: {
          cash,
          swipe,
          phonePay,
          total: cash + swipe + phonePay,
        }
      },
      patients
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
