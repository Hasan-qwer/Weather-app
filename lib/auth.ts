import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { authConfig } from './auth.config';

// Use a plain object so `checks` reaches normalizeOAuth directly (Google()
// factory nests options one level deep, preventing the override).
const GoogleProvider = {
  id: 'google',
  name: 'Google',
  type: 'oidc' as const,
  issuer: 'https://accounts.google.com',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  // Use state-only: no PKCE cookie to decode, no secret-mismatch risk.
  checks: ['state'] as ['state'],
  authorization: {
    params: {
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code',
    },
  },
  profile(profile: Record<string, string>) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  trustHost: true,
  logger: {
    debug: (msg, meta) => console.log('[AUTH DEBUG]', msg, JSON.stringify(meta ?? '')),
    error: (e) => console.error('[AUTH ERROR]', e),
    warn: (code) => console.warn('[AUTH WARN]', code),
  },
  // State cookie must survive the cross-origin redirect from Google → Vercel.
  cookies: {
    state: {
      name: 'authjs.state',
      options: {
        httpOnly: true,
        sameSite: 'none' as const,
        path: '/',
        secure: true,
      },
    },
  },
  providers: [
    GoogleProvider,
    Credentials({
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
