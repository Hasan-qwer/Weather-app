import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Globe, MapPin, LogOut, User, Star, X, Navigation } from 'lucide-react';
import { auth, signOut } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardClient from '@/components/dashboard/DashboardClient';
import DashboardClock from '@/components/dashboard/DashboardClock';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { name, email, image, id: userId } = session.user;

  const favorites = await db.favoriteLocation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : (email?.[0]?.toUpperCase() ?? '?');

  async function removeFavorite(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const s = await auth();
    if (!s?.user?.id) return;
    await db.favoriteLocation.deleteMany({ where: { id, userId: s.user.id } });
    revalidatePath('/dashboard');
  }

  return (
    <div className="min-h-screen">
      <DashboardClient />

      {/* ── Top navigation bar ──────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 px-6 py-3">
        {/* Glass background */}
        <div className="absolute inset-0 border-b border-white/10 bg-[#080c14]/70 backdrop-blur-md" />

        <div className="relative flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-black tracking-tight text-white drop-shadow transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-400/30">
              <Globe className="h-4 w-4 text-blue-400" />
            </div>
            Live<span className="text-blue-400">Atlas</span>
          </Link>

          {/* Right: clock + sign out */}
          <div className="flex items-center gap-3">
            <DashboardClock />

            <div className="h-6 w-px bg-white/15" />

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200 shadow backdrop-blur transition-all hover:bg-blue-500/35 hover:text-white hover:border-blue-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Profile card — top left ──────────────────────────── */}
      <aside className="fixed left-4 top-36 z-20 w-72">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-3">
            {image ? (
              <Image
                src={image}
                alt={name ?? 'Avatar'}
                width={48}
                height={48}
                className="rounded-full ring-2 ring-blue-500/40"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/20 ring-2 ring-blue-500/40">
                <span className="text-base font-bold text-blue-400">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                <p className="truncate font-semibold text-white">{name ?? 'User'}</p>
              </div>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Saved locations — bottom right ───────────────────── */}
      <aside className="fixed bottom-4 right-4 z-20 w-80">
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <Star className="h-4 w-4 text-yellow-400" aria-hidden="true" />
            Saved Locations
            {favorites.length > 0 && (
              <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                {favorites.length}
              </span>
            )}
          </h2>

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <MapPin className="h-5 w-5 text-slate-600" />
              <p className="text-xs text-slate-400">No saved locations yet</p>
              <Link
                href="/"
                className="mt-1 rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-500/20"
              >
                Explore the map
              </Link>
            </div>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto" aria-label="Saved locations">
              {favorites.map((fav) => {
                const flyUrl =
                  `/?id=${encodeURIComponent(fav.id)}` +
                  `&lat=${fav.latitude}&lng=${fav.longitude}` +
                  `&name=${encodeURIComponent(fav.name)}` +
                  `&country=${encodeURIComponent(fav.country)}` +
                  `&tz=${encodeURIComponent(fav.timezone)}`;

                return (
                  <li
                    key={fav.id}
                    className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/[0.08]"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{fav.name}</p>
                      <p className="text-xs text-slate-500">{fav.country}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={flyUrl}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-blue-400 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-500/10"
                        aria-label={`Fly to ${fav.name}`}
                      >
                        <Navigation className="h-3 w-3" />
                        Fly to
                      </Link>
                      <form action={removeFavorite}>
                        <input type="hidden" name="id" value={fav.id} />
                        <button
                          type="submit"
                          className="rounded-lg p-1 text-slate-600 transition-colors hover:text-red-400"
                          aria-label={`Remove ${fav.name} from favourites`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
