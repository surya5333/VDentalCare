import { NextResponse } from 'next/server';
import { apiMediaRepository } from '@/repositories/apiMediaRepository';
import { authorize, isAuthError } from '@/lib/authorize';

// Validates URL scheme to prevent javascript: or data: injection
function isValidUrl(url: string) {
  if (!url) return false;
  // Allow relative paths
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  try {
    const { opNumber } = await params;
    const images = await apiMediaRepository.getTreatmentPlanImages(opNumber);
    return NextResponse.json(images);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opNumber: string }> }
) {
  const auth = await authorize(['CLINIC_HEAD', 'IMAGE_UPLOADER']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { opNumber } = await params;
    const body = await request.json();

    if (!isValidUrl(body.fileUrl)) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    const newImage = await apiMediaRepository.addTreatmentPlanImage(opNumber, body);
    return NextResponse.json(newImage, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
