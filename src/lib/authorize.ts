import { getSession, SessionPayload } from './auth';
import { NextResponse } from 'next/server';

type Role = 'FRONT_OFFICE' | 'CLINIC_HEAD' | 'WORKING_DOCTOR' | 'MANAGER' | 'IMAGE_UPLOADER';

/**
 * Checks authentication and optionally authorization.
 * Returns the session if authorized, or a NextResponse error.
 */
export async function authorize(
  allowedRoles?: Role[]
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSession();

  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role as Role)) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
  }

  return { session };
}

/**
 * Helper to check if authorize result is an error.
 */
export function isAuthError(
  result: { session: SessionPayload } | { error: NextResponse }
): result is { error: NextResponse } {
  return 'error' in result;
}
