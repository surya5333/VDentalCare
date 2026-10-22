import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, isAuthError } from '@/lib/authorize';

function formatDate(d: Date): string {
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export async function GET(request: Request) {
  const auth = await authorize(['IMAGE_UPLOADER', 'FRONT_OFFICE', 'CLINIC_HEAD', 'WORKING_DOCTOR']);
  if (isAuthError(auth)) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      // Return top 5 recent OPs
      const recentOps = await prisma.oPRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          opNumber: true,
          patientName: true,
          date: true,
          createdAt: true,
        },
      });

      const formatted = recentOps.map((op) => ({
        id: op.id,
        opNumber: op.opNumber,
        patientName: op.patientName,
        date: formatDate(op.date),
        createdAt: op.createdAt.toISOString(),
      }));

      return NextResponse.json({ mode: 'recent', ops: formatted });
    }

    // Search by OP Number or Patient Name
    const matchingOps = await prisma.oPRecord.findMany({
      where: {
        OR: [
          { opNumber: { contains: query, mode: 'insensitive' } },
          { patientName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        opNumber: true,
        patientName: true,
        date: true,
        createdAt: true,
      },
    });

    const formatted = matchingOps.map((op) => ({
      id: op.id,
      opNumber: op.opNumber,
      patientName: op.patientName,
      date: formatDate(op.date),
      createdAt: op.createdAt.toISOString(),
    }));

    return NextResponse.json({ mode: 'search', ops: formatted });
  } catch (error) {
    console.error('Failed to query uploader ops:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
