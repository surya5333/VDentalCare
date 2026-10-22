import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing or empty in production.'
      );
    }
    console.warn(
      'WARNING: JWT_SECRET is not set. Using dev fallback secret. Set JWT_SECRET in production!'
    );
    return new TextEncoder().encode('vdental-dev-fallback-secret-minimum-32-chars!');
  }

  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long in production for HMAC-SHA256 security.'
    );
  }

  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  id: string;
  username: string;
  role: 'FRONT_OFFICE' | 'CLINIC_HEAD' | 'WORKING_DOCTOR' | 'MANAGER' | 'IMAGE_UPLOADER';
  [key: string]: unknown;
}

export async function signJWT(payload: SessionPayload): Promise<string> {
  const key = getJwtSecretKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const key = getJwtSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function createSession(payload: SessionPayload) {
  const token = await signJWT(payload);
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
