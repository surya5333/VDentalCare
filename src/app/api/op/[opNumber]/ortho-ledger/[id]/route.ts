import { NextResponse } from "next/server";
import { orthoLedgerService } from "@/services/orthoLedgerService";
import { authorize, isAuthError } from "@/lib/authorize";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opNumber: string; id: string }> }
) {
  const auth = await authorize(["FRONT_OFFICE", "MANAGER", "CLINIC_HEAD"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber, id } = await params;
    const body = await request.json();

    const updated = await orthoLedgerService.editTransaction(opNumber, id, {
      date: body.date,
      paidAmount: body.paidAmount !== undefined ? Number(body.paidAmount) : undefined,
      discount: body.discount !== undefined ? Number(body.discount) : undefined,
      paymentMode: body.paymentMode,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    if (
      err.message.includes("negative") ||
      err.message.includes("Invalid payment mode") ||
      err.message.includes("exceed") ||
      err.message.includes("must have either payment or discount") ||
      err.message.includes("Invalid transaction date")
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (
      err.message === "OP Record not found" ||
      err.message === "Transaction not found" ||
      err.message.includes("does not belong")
    ) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ opNumber: string; id: string }> }
) {
  const auth = await authorize(["FRONT_OFFICE", "MANAGER", "CLINIC_HEAD"]);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber, id } = await params;
    const result = await orthoLedgerService.deleteTransaction(opNumber, id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    if (
      err.message === "OP Record not found" ||
      err.message === "Transaction not found" ||
      err.message.includes("does not belong")
    ) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
