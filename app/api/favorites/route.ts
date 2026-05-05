import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const favorites = await db.favoriteLocation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(favorites);
}

const createSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: unknown = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const { name, country, latitude, longitude, timezone } = parsed.data;

  // Return existing if already saved (idempotent)
  const existing = await db.favoriteLocation.findFirst({
    where: { userId: session.user.id, latitude, longitude },
  });
  if (existing) return NextResponse.json(existing);

  const favorite = await db.favoriteLocation.create({
    data: { userId: session.user.id, name, country, latitude, longitude, timezone },
  });
  return NextResponse.json(favorite, { status: 201 });
}
