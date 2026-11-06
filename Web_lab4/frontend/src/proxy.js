import { NextResponse } from 'next/server';

export function proxy(request) {
  const token = request.cookies.get('accessToken')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/students') || pathname === '/profile';
  const isAdminRoute = pathname === '/students/new' || pathname.endsWith('/edit');

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdminRoute && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/students', request.url));
  }

  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/students', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/students/:path*', '/profile', '/login', '/register'],
};