import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiPatientLedgerRepository } from "../../../../../repositories/apiPatientLedgerRepository";
import { finalBillService } from "../../../../../services/finalBillService";
import { authorize, isAuthError } from "@/lib/authorize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  // Final Bill: Accessible by all roles that can view OP Details
  const auth = await authorize(['CLINIC_HEAD', 'MANAGER', 'FRONT_OFFICE', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const p = await params;
    const opNumber = p.opNumber;

    if (!opNumber) {
      return NextResponse.json(
        { error: "OP Number is required" },
        { status: 400 }
      );
    }

    // Get raw OP record with finalized treatments included
    const opRecord = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: {
        finalizedTreatments: {
          include: {
            treatment: true,
            crownType: true,
          },
        },
      },
    });

    if (!opRecord) {
      return NextResponse.json({ error: "OP not found" }, { status: 404 });
    }

    // Fetch ledger history chronologically
    const ledgers = await apiPatientLedgerRepository.getLedgerByOpId(
      opRecord.id
    );

    // Generate PDF buffer
    const pdfBuffer = await finalBillService.generatePdf(opRecord, ledgers);

    // Return the response as a PDF
    const pdfBytes = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBytes.length),
        "Content-Disposition": `inline; filename="V-Dental-Care-Final-Bill-${opNumber}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error generating Final Bill:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
