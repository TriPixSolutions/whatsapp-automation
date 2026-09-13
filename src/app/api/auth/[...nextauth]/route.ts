import { NextRequest, NextResponse } from 'next/server';

/**
 * [...nextauth] catch-all stub.
 * This project uses a custom cookie-based RBAC system instead of NextAuth.
 * Google OAuth is handled via /api/auth/google and /api/auth/google/callback.
 *
 * This file only exists so that any legacy next-auth imports don't break the build.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Use /api/auth/google for Google OAuth' }, { status: 200 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Use /api/auth/google for Google OAuth' }, { status: 200 });
}
