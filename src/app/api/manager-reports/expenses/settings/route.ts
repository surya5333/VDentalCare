import { NextResponse } from 'next/server';
import { apiExpenseSettingsRepository } from '@/repositories/apiExpenseSettingsRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET() {
  const auth = await authorize(['MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const settings = await apiExpenseSettingsRepository.getSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await authorize(['MANAGER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = await request.json();
    if (!Array.isArray(body.updates)) {
      return NextResponse.json({ error: "Invalid body format. Expected { updates: [{ key, percentage }] }" }, { status: 400 });
    }

    const updated = await apiExpenseSettingsRepository.updateSettings(body.updates);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
