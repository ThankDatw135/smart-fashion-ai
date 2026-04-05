import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy — Route Protection
 * Updated convention: Next.js 16+ uses proxy.ts instead of middleware.ts
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth cookies set by useAuth hook
  const token = request.cookies.get('auth-token')?.value;
  // Normalize role to lowercase to prevent case-sensitivity bugs
  const role = request.cookies.get('user-role')?.value?.toLowerCase();

  // 1. Protect /account routes — require authentication
  if (pathname.startsWith('/account')) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url)
      );
    }
  }

  // 2. Protect /admin routes — require authentication + admin role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url)
      );
    }
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. Redirect authenticated users away from auth pages
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp'];
  if (authRoutes.includes(pathname) && token) {
    if (role === 'admin' || role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, API routes, and images
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
};
