import { NextResponse } from 'next/server';
import { apiOPRepository } from '@/repositories/apiOPRepository';
import { authorize, isAuthError } from '@/lib/authorize';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const doctorId = searchParams.get('doctorId') || undefined;

    const results = await apiOPRepository.findAll('GENERAL', { query, doctorId });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching OP records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorize(['FRONT_OFFICE']);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.opNumber || !body.patientName || !body.phone || !body.date || !body.sex || !body.paidStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: opNumber, patientName, phone, date, sex, paidStatus' },
        { status: 400 }
      );
    }

    // Coerce age to integer
    const age = typeof body.age === 'string' ? parseInt(body.age, 10) : body.age;
    if (typeof age !== 'number' || isNaN(age) || age < 1 || age > 150) {
      return NextResponse.json({ error: 'age must be a valid number between 1 and 150' }, { status: 400 });
    }

    // Normalize date: accept DD/MM/YYYY or YYYY-MM-DD
    let dateStr = body.date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      dateStr = `${d}/${m}/${y}`;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return NextResponse.json({ error: 'date must be DD/MM/YYYY or YYYY-MM-DD' }, { status: 400 });
    }

    // Validate sex
    if (!['Male', 'Female', 'Others'].includes(body.sex)) {
      return NextResponse.json({ error: 'sex must be Male, Female, or Others' }, { status: 400 });
    }

    // Validate paidStatus
    if (!['Paid', 'Free', 'paid', 'free'].includes(body.paidStatus)) {
      return NextResponse.json({ error: 'paidStatus must be Paid or Free' }, { status: 400 });
    }

    const isPaid = ['Paid', 'paid'].includes(body.paidStatus);
    const validModes = ['Cash', 'UPI', 'Phone Pay', 'Swipe', 'Card', 'Bank Transfer'];

    let registrationFee = 0;
    let paymentMode: string | undefined = undefined;

    if (isPaid) {
      if (!body.paymentMode || !validModes.includes(body.paymentMode)) {
        return NextResponse.json(
          { error: `Payment mode is required for Paid OP registrations. Allowed modes: ${validModes.join(', ')}` },
          { status: 400 }
        );
      }
      paymentMode = body.paymentMode;
      registrationFee = typeof body.registrationFee === 'number' && body.registrationFee >= 0
        ? body.registrationFee
        : 200;
    } else {
      registrationFee = 0;
      paymentMode = undefined;
    }

    const payload = {
      ...body,
      age,
      date: dateStr,
      paidStatus: isPaid ? 'Paid' : 'Free',
      registrationFee,
      paymentMode,
    };

    const newOP = await apiOPRepository.create(payload);
    return NextResponse.json(newOP, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    const msg = err.message || '';
    if (msg.includes('Unique constraint') || err.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate OP number' }, { status: 409 });
    }
    console.error('POST /api/op error:', err.message, err);
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}
