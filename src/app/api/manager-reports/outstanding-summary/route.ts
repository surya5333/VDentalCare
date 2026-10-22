import { NextResponse } from 'next/server';
import { managerReportService } from '@/services/managerReportService';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(request: Request) {
  const auth = await authorize(['MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month");

    if (!monthStr) {
      return NextResponse.json({ error: "Missing month query parameter" }, { status: 400 });
    }

    const report = await managerReportService.getOutstandingSummary(monthStr);
    return NextResponse.json(report);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes("Invalid or missing month") || err.message.includes("Invalid month value")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
