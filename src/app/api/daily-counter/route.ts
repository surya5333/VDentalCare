import { NextResponse } from 'next/server';
import { dailyCounterService } from '@/services/dailyCounterService';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(request: Request) {
  // Counter Book / Daily Counter: FRONT_OFFICE, CLINIC_HEAD, MANAGER
  const auth = await authorize(['FRONT_OFFICE', 'CLINIC_HEAD', 'MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Missing date query parameter" }, { status: 400 });
    }
//have to optimize the work flow
    const report = await dailyCounterService.getDailyCounter(dateStr);
    return NextResponse.json(report);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes("Invalid or missing date")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
