import { signIn } from '@/lib/auth';

export default async function GoogleSignInPage() {
  await signIn('google', { redirectTo: '/dashboard' });
}
