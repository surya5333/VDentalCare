import { NextResponse } from 'next/server';
import { apiLabRepository } from '@/repositories/apiLabRepository';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const labs = await apiLabRepository.getLabs(includeInactive);
    return NextResponse.json(labs, {
      headers: {
        'Cache-Control': includeInactive
          ? 'no-store, max-age=0'
          : 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await apiLabRepository.createLab(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
