import type { NextAuthConfig } from 'next-auth';

// Edge-safe config (no Prisma/bcrypt imports) — used by middleware
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.startsWith('/dashboard')) return isLoggedIn;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
