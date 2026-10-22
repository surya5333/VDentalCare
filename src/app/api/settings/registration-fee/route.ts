import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, isAuthError } from '@/lib/authorize';
const DEFAULT_FEE = 200;

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'op_registration_fee' }
    });

    const fee = setting ? parseInt(setting.value, 10) || DEFAULT_FEE : DEFAULT_FEE;
    return NextResponse.json({ fee });
  } catch (err) {
    console.error("Failed to load registration fee setting:", err);
    return NextResponse.json({ fee: DEFAULT_FEE });
  }
}

export async function PUT(request: Request) {
  const auth = await authorize(['MANAGER', 'CLINIC_HEAD', 'FRONT_OFFICE']);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = await request.json();
    const feeNum = typeof body.fee === 'string' ? parseInt(body.fee, 10) : body.fee;
    if (typeof feeNum !== 'number' || isNaN(feeNum) || feeNum < 0) {
      return NextResponse.json({ error: 'fee must be a non-negative number' }, { status: 400 });
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key: 'op_registration_fee' },
      create: {
        key: 'op_registration_fee',
        value: feeNum.toString(),
        label: 'OP Registration Fee',
      },
      update: {
        value: feeNum.toString(),
      }
    });

    return NextResponse.json({ fee: parseInt(updated.value, 10) });
  } catch (err) {
    console.error("Failed to update registration fee setting:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
