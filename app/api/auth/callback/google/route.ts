import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { encode } from '@auth/core/jwt';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';
const SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
// Auth.js v5 prefixes the session cookie with __Secure- on HTTPS (production).
const SESSION_COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  if (oauthError || !code || !state) {
    return NextResponse.redirect(`${BASE_URL}/error?error=OAuthCallback`);
  }

  // Verify HMAC state — no cookie required.
  try {
    const [nonce, sig] = state.split('.');
    if (!nonce || !sig) throw new Error('bad state');
    const expected = createHmac('sha256', SECRET).update(nonce).digest('hex');
    if (sig !== expected) throw new Error('invalid sig');
  } catch {
    return NextResponse.redirect(`${BASE_URL}/error?error=OAuthCallback`);
  }

  // Exchange authorisation code for tokens.
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${BASE_URL}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      console.error('[GOOGLE CB] token exchange failed', await tokenRes.text());
      return NextResponse.redirect(`${BASE_URL}/error?error=OAuthCallback`);
    }
    ({ access_token: accessToken } = await tokenRes.json());
  } catch (e) {
    console.error('[GOOGLE CB] token fetch error', e);
    return NextResponse.redirect(`${BASE_URL}/error?error=OAuthCallback`);
  }

  // Fetch Google user profile.
  let profile: { sub: string; email: string; name: string; picture: string };
  try {
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      console.error('[GOOGLE CB] profile fetch failed', await profileRes.text());
      return NextResponse.redirect(`${BASE_URL}/error?error=OAuthCallback`);
    }
    profile = await profileRes.json();
  } catch (e) {
    console.error('[GOOGLE CB] profile error', e);
    return NextResponse.redirect(`${BASE_URL}/error?error=OAuthCallback`);
  }

  // Find or create user + account in the database.
  let user;
  try {
    user = await db.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: profile.email,
          name: profile.name ?? null,
          image: profile.picture ?? null,
        },
      });
    } else if (!user.image && profile.picture) {
      user = await db.user.update({
        where: { id: user.id },
        data: { image: profile.picture },
      });
    }

    // Upsert the OAuth account link.
    await db.account.upsert({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.sub } },
      create: {
        userId: user.id,
        type: 'oidc',
        provider: 'google',
        providerAccountId: profile.sub,
        access_token: accessToken,
      },
      update: { access_token: accessToken },
    });
  } catch (e) {
    console.error('[GOOGLE CB] db error', e);
    return NextResponse.redirect(`${BASE_URL}/error?error=Configuration`);
  }

  // Mint an Auth.js-compatible encrypted JWT session token.
  let sessionToken: string;
  try {
    sessionToken = await encode({
      token: {
        sub: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.image,
      },
      secret: SECRET,
      salt: SESSION_COOKIE,
      maxAge: 30 * 24 * 60 * 60,
    });
  } catch (e) {
    console.error('[GOOGLE CB] jwt encode error', e);
    return NextResponse.redirect(`${BASE_URL}/error?error=Configuration`);
  }

  const res = NextResponse.redirect(`${BASE_URL}/dashboard`);
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
