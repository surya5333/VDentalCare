import { NextResponse } from 'next/server';
import { apiDoctorVisitRepository } from '@/repositories/apiDoctorVisitRepository';
import { authorize, isAuthError } from '@/lib/authorize';

function isValidUrl(url: string) {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string, id: string }> }
) {
  const auth = await authorize(['WORKING_DOCTOR', 'IMAGE_UPLOADER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber, id } = await params;
    const body = await request.json();

    if (!isValidUrl(body.fileUrl)) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    const newImage = await apiDoctorVisitRepository.addImage(opNumber, id, body);
    return NextResponse.json(newImage, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
