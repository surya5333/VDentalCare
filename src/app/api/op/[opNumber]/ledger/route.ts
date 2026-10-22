import { NextResponse } from "next/server";
import { patientLedgerService } from "@/services/patientLedgerService";
import { authorize, isAuthError } from "@/lib/authorize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  // Ledger viewing: FRONT_OFFICE, CLINIC_HEAD, MANAGER, WORKING_DOCTOR
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD', 'MANAGER', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const data = await patientLedgerService.getLedger(opNumber);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "OP Record not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  // Payment entry: FRONT_OFFICE and CLINIC_HEAD
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const body = await request.json();
    
    // Ensure numbers are properly parsed
    const paidAmount = Number(body.paidAmount || 0);
    const discount = Number(body.discount || 0);
    const idempotencyKey = body.idempotencyKey || request.headers.get("idempotency-key") || undefined;

    const transaction = await patientLedgerService.addTransaction(opNumber, {
      date: body.date || new Date().toISOString(),
      finalizedTreatmentId: body.finalizedTreatmentId,
      paidAmount,
      discount,
      paymentMode: body.paymentMode,
      idempotencyKey,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (
      err.message.includes("negative") ||
      err.message.includes("Invalid payment mode") ||
      err.message.includes("exceeds") ||
      err.message.includes("greater than") ||
      err.message.includes("must have either payment or discount") ||
      err.message.includes("does not belong to this OP")
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.message === "OP Record not found" || err.message === "Finalized treatment not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
