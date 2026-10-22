import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

// Note: For a real production app, use bcrypt or argon2. 
// For this MVP to avoid external binary dependencies, we'll do a simple mock hash 
// or assume passwordHash is stored directly if the app doesn't have bcrypt yet.
// In Phase 8 we should hash passwords. Let's install bcryptjs later if needed, 
// or just compare directly for now since "NEVER store plaintext passwords" was explicitly requested.
// Actually, I should install bcryptjs to meet the requirement.
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Dynamic import to avoid edge runtime issues if needed, or just standard import
    // Let's assume we'll use bcryptjs. I will install it next.
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session
    await createSession({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, username: user.username, role: user.role } 
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
