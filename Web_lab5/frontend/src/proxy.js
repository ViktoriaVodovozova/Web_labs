import { NextResponse } from 'next/server';

export function proxy(request) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/students') || pathname === '/profile';

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/students/:path*', '/profile', '/login', '/register'],
};
