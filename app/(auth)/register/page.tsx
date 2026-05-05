'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Globe } from 'lucide-react';
import { registerUser } from '@/app/actions/auth';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Account created! Please sign in.');
      router.push('/login');
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 backdrop-blur transition-colors focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  return (
    <div>
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" />
          <span className="text-2xl font-bold text-white">
            Live<span className="text-blue-400">Atlas</span>
          </span>
        </div>
        <p className="text-sm text-slate-500">Create your account</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
          {/* Name */}
          <div>
            <label htmlFor="reg-name" className="sr-only">Full name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="Full name"
              autoComplete="name"
              className={fieldClass}
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400" role="alert">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="sr-only">Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              className={fieldClass}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400" role="alert">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="sr-only">Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Password (min 8 chars)"
                autoComplete="new-password"
                className={`${fieldClass} pr-10`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus-visible:outline-none"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400" role="alert">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="reg-confirm" className="sr-only">Confirm password</label>
            <input
              id="reg-confirm"
              type={showPw ? 'text' : 'password'}
              placeholder="Confirm password"
              autoComplete="new-password"
              className={fieldClass}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-400 transition-colors hover:text-blue-300 focus-visible:outline-none focus-visible:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center">
        <Link
          href="/"
          className="text-xs text-slate-600 transition-colors hover:text-slate-400"
        >
          ← Back to map
        </Link>
      </p>
    </div>
  );
}
