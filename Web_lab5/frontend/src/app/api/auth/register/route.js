import { NextResponse } from 'next/server';
export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/auth/register`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    const data = await res.json();
    if (!res.ok) return NextResponse.json({error:data.message || data.error || 'Ошибка регистрации'}, {status:res.status});
    const response = NextResponse.json({success:true});
    response.cookies.set('accessToken',data.accessToken,{httpOnly:true,sameSite:'lax',path:'/',maxAge:data.expiresIn});
    response.cookies.set('refreshToken',data.refreshToken,{httpOnly:true,sameSite:'lax',path:'/',maxAge:604800});
    return response;
  } catch {return NextResponse.json({error:'Backend недоступен'}, {status:502});}
}
