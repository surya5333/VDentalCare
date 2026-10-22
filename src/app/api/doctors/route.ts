import { NextResponse } from 'next/server';
import { apiCatalogueRepository } from '@/repositories/apiCatalogueRepository';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const doctors = await apiCatalogueRepository.getDoctors(includeInactive);
    return NextResponse.json(doctors, {
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
    const result = await apiCatalogueRepository.createDoctor(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
