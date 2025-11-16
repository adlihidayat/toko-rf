// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear all auth cookies
    response.cookies.set('auth-token', '', { maxAge: 0 });
    response.cookies.set('user-role', '', { maxAge: 0 });
    response.cookies.set('user-id', '', { maxAge: 0 });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear all auth cookies
    response.cookies.set('auth-token', '', { maxAge: 0 });
    response.cookies.set('user-role', '', { maxAge: 0 });
    response.cookies.set('user-id', '', { maxAge: 0 });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 400 }
    );
  }
}