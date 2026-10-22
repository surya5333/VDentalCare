import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || '';
const key = new TextEncoder().encode(JWT_SECRET);

// Role to route mapping
const ROLE_ROUTES: Record<string, string> = {
  FRONT_OFFICE: '/front-office',
  CLINIC_HEAD: '/clinic-head',
  WORKING_DOCTOR: '/working-doctor',
  MANAGER: '/manager',
  IMAGE_UPLOADER: '/image-uploader',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, auth API, and media serving without token
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/media/')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    const role = payload.role as string;

    // For frontend pages: enforce role-to-route mapping
    if (!pathname.startsWith('/api/')) {
      const roleRoute = ROLE_ROUTES[role];

      // Settings access: only FRONT_OFFICE and CLINIC_HEAD
      if (pathname.startsWith('/settings')) {
        if (role !== 'FRONT_OFFICE' && role !== 'CLINIC_HEAD') {
          return NextResponse.redirect(new URL(roleRoute, request.url));
        }
      }

      // Redirect root to role dashboard
      if (pathname === '/') {
        return NextResponse.redirect(new URL(roleRoute, request.url));
      }

      // Block access to another role's workspace
      for (const [r, route] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(route) && r !== role) {
          return NextResponse.redirect(new URL(roleRoute, request.url));
        }
      }
    } else {
      // API Route protection
      if (request.method !== 'GET') {
        const masterRoutes = ['/api/treatments', '/api/doctors', '/api/references', '/api/labs', '/api/crown-types'];
        const isMaster = masterRoutes.some(r => pathname.startsWith(r));
        if (isMaster && role !== 'FRONT_OFFICE' && role !== 'CLINIC_HEAD') {
          return NextResponse.json({ error: 'Unauthorized role for settings management' }, { status: 403 });
        }
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
