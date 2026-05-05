import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Proxy (Next.js 16) — runs in Node.js runtime; protects /dashboard via JWT check
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
