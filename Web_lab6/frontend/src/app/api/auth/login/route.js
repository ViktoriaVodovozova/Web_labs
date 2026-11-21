import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${process.env.INTERNAL_API_URL || 'http://java-backend:8000'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) return NextResponse.json(data, { status: res.status });

    const response = NextResponse.json({ success: true });
    response.cookies.set('accessToken', data.accessToken, { httpOnly: true, maxAge: data.expiresIn, path: '/' });
    response.cookies.set('role', data.role, { maxAge: 60 * 60 * 24 * 7, path: '/' });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}