'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { error: 'An account with this email already exists.' };

    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.create({ data: { name, email, passwordHash } });
    return {};
  } catch {
    return { error: 'Registration failed. Please try again.' };
  }
}
