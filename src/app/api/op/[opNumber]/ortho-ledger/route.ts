import { NextResponse } from "next/server";
import { orthoLedgerService } from "@/services/orthoLedgerService";
import { authorize, isAuthError } from "@/lib/authorize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD', 'MANAGER', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const data = await orthoLedgerService.getLedger(opNumber);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "OP Record not found" || err.message === "OP is not an Ortho case") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const body = await request.json();

    const paidAmount = Number(body.paidAmount || 0);
    const discount = Number(body.discount || 0);
    const idempotencyKey = body.idempotencyKey || request.headers.get("idempotency-key") || undefined;

    const transaction = await orthoLedgerService.addTransaction(opNumber, {
      date: body.date || new Date().toISOString(),
      orthoTreatmentId: body.orthoTreatmentId,
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
    if (err.message === "OP Record not found" || err.message === "OP is not an Ortho case" || err.message === "Ortho treatment not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
