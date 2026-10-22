import { NextResponse } from 'next/server';
import { authorize, isAuthError } from '@/lib/authorize';
import { apiMediaRepository } from '@/repositories/apiMediaRepository';
import { apiDoctorVisitRepository } from '@/repositories/apiDoctorVisitRepository';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

function tryLocalCacheWrite(subDir: string, filename: string, buffer: Buffer): void {
  // On Vercel or read-only serverless platforms, skip local disk cache writes.
  // PostgreSQL Bytea storage is the authoritative source of truth.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }
  try {
    const cacheDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = path.join(cacheDir, filename);
    fs.writeFileSync(cachePath, buffer);
  } catch {
    // Optional fallback cache write; safe to ignore
  }
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  // PNG: 89 50 4E 47
  if (mimeType.includes('png')) {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  // WEBP: RIFF ... WEBP
  if (mimeType.includes('webp')) {
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }

  return true;
}

function sanitizeFilename(original: string): string {
  const base = path.basename(original).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.substring(0, 100);
}

export async function POST(request: Request) {
  const auth = await authorize(['IMAGE_UPLOADER', 'CLINIC_HEAD', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string | null;
    const opNumber = formData.get('opNumber') as string | null;
    const visitId = formData.get('visitId') as string | null;

    if (!file || !category || !opNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters: file, category, opNumber' },
        { status: 400 }
      );
    }

    if (!['x-ray', 'treatment-plan', 'doctor-visit'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be x-ray, treatment-plan, or doctor-visit' },
        { status: 400 }
      );
    }

    // Role-specific check
    const role = auth.session.role;
    if (category === 'doctor-visit' && role !== 'IMAGE_UPLOADER' && role !== 'WORKING_DOCTOR') {
      return NextResponse.json({ error: 'Forbidden for this category' }, { status: 403 });
    }
    if ((category === 'x-ray' || category === 'treatment-plan') && role !== 'IMAGE_UPLOADER' && role !== 'CLINIC_HEAD') {
      return NextResponse.json({ error: 'Forbidden for this category' }, { status: 403 });
    }

    // File validation
    if (file.size <= 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File exceeds maximum limit of 15MB' }, { status: 400 });
    }

    const mimeType = file.type || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WEBP` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'File header does not match expected image signature' },
        { status: 400 }
      );
    }

    // Verify OP Record exists
    const op = await prisma.oPRecord.findUnique({
      where: { opNumber },
    });
    if (!op) {
      return NextResponse.json({ error: `OP Record ${opNumber} not found` }, { status: 404 });
    }

    const cleanOriginalName = sanitizeFilename(file.name || `${category}.jpg`);

    // Persist according to category
    if (category === 'x-ray') {
      const record = await apiMediaRepository.setXRay(opNumber, {
        originalFilename: cleanOriginalName,
        fileData: buffer,
        mimeType,
        uploadedBy: auth.session.username,
      });

      tryLocalCacheWrite('x-rays', `${record.id}.jpg`, buffer);

      return NextResponse.json({
        success: true,
        category: 'x-ray',
        image: {
          id: record.id,
          fileUrl: record.fileUrl,
          originalFilename: record.originalFilename,
          uploadedAt: record.uploadedAt,
        },
      }, { status: 201 });
    }

    if (category === 'treatment-plan') {
      const record = await apiMediaRepository.setTreatmentPlanImage(opNumber, {
        originalFilename: cleanOriginalName,
        fileData: buffer,
        mimeType,
        uploadedBy: auth.session.username,
      });

      tryLocalCacheWrite('treatment-plans', `${record.id}.jpg`, buffer);

      return NextResponse.json({
        success: true,
        category: 'treatment-plan',
        image: {
          id: record.id,
          fileUrl: record.fileUrl,
          originalFilename: record.originalFilename,
          uploadedAt: record.uploadedAt,
        },
      }, { status: 201 });
    }

    if (category === 'doctor-visit') {
      if (!visitId) {
        return NextResponse.json(
          { error: 'visitId is required for doctor-visit photos' },
          { status: 400 }
        );
      }

      // Validate visit belongs to this OP
      const visit = await prisma.doctorVisit.findUnique({
        where: { id: visitId },
      });
      if (!visit) {
        return NextResponse.json({ error: 'Doctor visit not found' }, { status: 404 });
      }
      if (visit.opRecordId !== op.id) {
        return NextResponse.json(
          { error: 'Doctor visit does not belong to the selected OP record' },
          { status: 400 }
        );
      }

      const record = await apiDoctorVisitRepository.addImage(opNumber, visitId, {
        originalFilename: cleanOriginalName,
        fileData: buffer,
        mimeType,
        uploadedBy: auth.session.username,
      });

      tryLocalCacheWrite('doctor-visits', `${record.id}.jpg`, buffer);

      return NextResponse.json({
        success: true,
        category: 'doctor-visit',
        visitId,
        image: {
          id: record.id,
          fileUrl: record.fileUrl,
          originalFilename: record.originalFilename,
          uploadedAt: record.uploadedAt,
        },
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
