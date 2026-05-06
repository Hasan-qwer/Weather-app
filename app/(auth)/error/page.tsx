'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Globe } from 'lucide-react';

const MESSAGES: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration. Please try again later.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The sign-in link has expired. Please request a new one.',
  OAuthSignin: 'Could not start the Google sign-in flow. Please try again.',
  OAuthCallback: 'Could not complete sign-in. Please try again.',
  OAuthCreateAccount: 'Could not create your account. Please try again.',
  EmailCreateAccount: 'Could not create your account. Please try again.',
  Callback: 'Could not complete sign-in. Please try again.',
  Default: 'Something went wrong. Please try again.',
};

export default function AuthErrorPage() {
  const params = useSearchParams();
  const code = params.get('error') ?? 'Default';
  const message = MESSAGES[code] ?? MESSAGES.Default;

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" />
          <span className="text-2xl font-bold text-white">
            Live<span className="text-blue-400">Atlas</span>
          </span>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-white">Sign-in failed</h1>
        <p className="mb-6 text-sm text-slate-400">{message}</p>
        <Link
          href="/login"
          className="inline-block w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Try again
        </Link>
      </div>

      <p className="mt-4 text-center">
        <Link href="/" className="text-xs text-slate-600 transition-colors hover:text-slate-400">
          ← Back to map
        </Link>
      </p>
    </div>
  );
}
