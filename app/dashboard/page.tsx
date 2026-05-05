import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Globe, MapPin, LogOut, User, Star, X, Navigation } from 'lucide-react';
import { auth, signOut } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { name, email, image, id: userId } = session.user;

  const favorites = await db.favoriteLocation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
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
    <div className="min-h-screen bg-[#080c14] p-4">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.10) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-2xl pt-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-white transition-opacity hover:opacity-80"
          >
            <Globe className="h-5 w-5 text-blue-400" />
            Live<span className="text-blue-400">Atlas</span>
          </Link>

          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </div>

        {/* Profile card */}
        <div className="glass mb-6 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            {image ? (
              <Image
                src={image}
                alt={name ?? 'Avatar'}
                width={56}
                height={56}
                className="rounded-full ring-2 ring-blue-500/30"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 ring-2 ring-blue-500/30">
                <span className="text-lg font-bold text-blue-400">{initials}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <p className="font-semibold text-white">{name ?? 'User'}</p>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">{email}</p>
            </div>
          </div>
        </div>

        {/* Saved locations */}
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Star className="h-4 w-4 text-yellow-400" aria-hidden="true" />
            Saved Locations
            {favorites.length > 0 && (
              <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                {favorites.length}
              </span>
            )}
          </h2>

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                <MapPin className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-400">No saved locations yet</p>
                <p className="mt-1 text-xs text-slate-600">
                  Search for a city on the map and click ★ to save it here
                </p>
              </div>
              <Link
                href="/"
                className="mt-2 rounded-xl bg-blue-500/10 px-4 py-2 text-sm text-blue-400 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Explore the map
              </Link>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Saved locations">
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
                    className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 transition-colors hover:bg-white/[0.07]"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{fav.name}</p>
                      <p className="text-xs text-slate-500">{fav.country}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link
                        href={flyUrl}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-blue-400 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={`Fly to ${fav.name}`}
                      >
                        <Navigation className="h-3 w-3" />
                        Fly to
                      </Link>
                      <form action={removeFavorite}>
                        <input type="hidden" name="id" value={fav.id} />
                        <button
                          type="submit"
                          className="rounded-lg p-1.5 text-slate-600 transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          aria-label={`Remove ${fav.name} from favourites`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
