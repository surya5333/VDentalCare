import { NextResponse } from 'next/server';
import { apiMediaRepository } from '@/repositories/apiMediaRepository';
import { apiDoctorVisitRepository } from '@/repositories/apiDoctorVisitRepository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;

    let imageRecord: { fileData: Buffer | null; mimeType: string | null; fileUrl?: string } | null = null;

    if (type === 'x-rays') {
      imageRecord = await apiMediaRepository.getXRayById(id);
    } else if (type === 'treatment-plans') {
      imageRecord = await apiMediaRepository.getTreatmentPlanImageById(id);
    } else if (type === 'doctor-visits') {
      imageRecord = await apiDoctorVisitRepository.getImageById(id);
    } else {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    if (!imageRecord) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (imageRecord.fileData) {
      const buffer = Buffer.isBuffer(imageRecord.fileData) 
        ? imageRecord.fileData 
        : Buffer.from(imageRecord.fileData);

      const mimeType = imageRecord.mimeType || 'image/jpeg';

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return NextResponse.json({ error: 'No image data available' }, { status: 404 });
  } catch (error) {
    console.error('Failed to serve media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
