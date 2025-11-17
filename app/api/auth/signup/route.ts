// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
  try {
    const { username, email, phoneNumber, password, confirmPassword } =
      await request.json();

    // Validation
    if (!username || !email || !phoneNumber || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('+62')) {
      return NextResponse.json(
        { success: false, error: 'Phone number must start with +62' },
        { status: 400 }
      );
    }

    if (phoneNumber.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Phone number must be at least 10 digits after +62' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is already registered' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      phoneNumber,
      password,
      role: 'user',
      joinDate: new Date(),
    });

    // Convert to plain object
    const plainUser = user.toObject();
    const userId = plainUser._id?.toString();

    if (!userId) {
      throw new Error('Failed to create user - no ID generated');
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: {
          id: userId,
          username: plainUser.username,
          email: plainUser.email,
          phoneNumber: plainUser.phoneNumber,
          role: plainUser.role,
        },
      },
      { status: 201 }
    );

    // Set ALL the same cookies that login sets
    response.cookies.set('auth-token', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    response.cookies.set('user-id', userId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('user-role', plainUser.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('user-username', plainUser.username, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('user-email', plainUser.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('user-phone', plainUser.phoneNumber, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    console.log('✅ Signup successful - All cookies set for user:', userId);

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { success: false, error: `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}