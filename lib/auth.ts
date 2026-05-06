import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { authConfig } from './auth.config';

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const isProd = process.env.NODE_ENV === 'production';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  trustHost: true,
  logger: {
    error: (e) => console.error('[AUTH ERROR]', e),
    warn: (code) => console.warn('[AUTH WARN]', code),
  },
  cookies: {
    pkceCodeVerifier: {
      name: 'authjs.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
        path: '/',
        secure: isProd,
      },
    },
    state: {
      name: 'authjs.state',
      options: {
        httpOnly: true,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
        path: '/',
        secure: isProd,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
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
