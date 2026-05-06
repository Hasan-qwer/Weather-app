import { NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function GET() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  // HMAC-signed state — no cookie needed, verified on callback with the same secret.
  const nonce = randomBytes(32).toString('hex');
  const sig = createHmac('sha256', secret).update(nonce).digest('hex');
  const state = `${nonce}.${sig}`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/auth/callback/google`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
