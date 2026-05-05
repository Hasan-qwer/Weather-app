# LiveAtlas — Interactive Weather Globe

A production-ready, full-stack weather app built with Next.js 16 (App Router). Search any city or country and the globe flies to it, drops an animated marker, and shows real-time weather with a live local clock.

---

## Features

- **Interactive globe** — full-viewport dark map (MapLibre GL + Carto), smooth `flyTo` animation (3 s), pulsing marker
- **Country + city search** — debounced autocomplete powered by Open-Meteo geocoding (free, no key)
- **Real-time weather** — temperature, feels-like, humidity, wind direction, 24-hour area chart (Recharts)
- **Live local clock** — ticks every second using the location's IANA timezone via `Intl.DateTimeFormat`
- **Weather effects** — CSS/Framer Motion overlays: rain streaks, snow drift, sun glow, thunder flash, cloud vignette
- **Auth** — Google OAuth + email/password (bcrypt) via Auth.js v5
- **Favourites dashboard** — save locations, fly back to them with one click, delete
- **Responsive** — two-row header on mobile, bottom-sheet weather card, full a11y (ARIA comboboxes, focus rings, `role="timer"`)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router), TypeScript strict |
| Map | react-map-gl v8 + MapLibre GL JS, Carto dark style |
| Weather / Geocoding | Open-Meteo (free, no API key) |
| Auth | Auth.js v5 (next-auth@beta), Google OAuth + Credentials |
| Database | Prisma v5 + Neon Postgres (free tier) |
| Styling | Tailwind CSS v4, Framer Motion, glassmorphism |
| Charts | Recharts |
| Forms | react-hook-form + Zod |
| Toasts | Sonner |
| Icons | Lucide React |

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A free [Neon](https://neon.tech) account
- A Google Cloud project with OAuth 2.0 credentials (see below)

### 1 — Clone and install

```bash
git clone https://github.com/your-username/liveatlas.git
cd liveatlas
npm install
```

### 2 — Copy env file

```bash
cp .env.example .env.local
```

### 3 — Generate `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

Paste the output into `.env.local` as `NEXTAUTH_SECRET`.

### 4 — Google OAuth credentials

1. Open [Google Cloud Console](https://console.developers.google.com/) and select or create a project.
2. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Set **Application type** to **Web application**.
4. Under **Authorised redirect URIs** add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Click **Create**. Copy the **Client ID** and **Client Secret** into `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### 5 — Provision Neon Postgres

1. Sign up at [neon.tech](https://neon.tech) — the free tier is sufficient.
2. Create a new project and choose the region closest to you.
3. From **Dashboard → Connection Details**, copy the **Connection string** (starts with `postgresql://`).
4. Paste it into `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   ```

### 6 — Create database tables

```bash
npx prisma db push
```

### 7 — (Optional) Seed demo data

```bash
npx prisma db seed
```

Creates `demo@liveatlas.app` with three saved locations: Tokyo, Paris, New York.

### 8 — Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Vercel Deployment Guide

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial LiveAtlas app"
git remote add origin https://github.com/your-username/liveatlas.git
git push -u origin main
```

### Step 2 — Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import** next to your repository.
3. Framework is auto-detected as **Next.js** — leave all defaults.
4. Click **Deploy**. The first build may fail because env vars are not yet set. That is expected.

### Step 3 — Add environment variables

In your Vercel project → **Settings → Environment Variables**, add each of the following for **Production, Preview, and Development**:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | Your `openssl rand -base64 32` output |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` |
| `GOOGLE_CLIENT_ID` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | From Google Console |
| `DATABASE_URL` | Neon connection string |

### Step 4 — Add production redirect URI to Google

In Google Console → your OAuth client → **Authorised redirect URIs**, add:

```
https://your-project.vercel.app/api/auth/callback/google
```

### Step 5 — Redeploy

**Deployments → latest deployment → Redeploy** (clear build cache).

### Step 6 — Push schema to production database

Run once from your local machine:

```bash
DATABASE_URL="<your-neon-url>" npx prisma db push
```

> **Tip:** Add `"postinstall": "prisma generate"` to `package.json` scripts so Vercel regenerates the Prisma client automatically on every deploy.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | Yes | 32-byte random secret for JWT signing |
| `NEXTAUTH_URL` | Yes (prod) | Your app's canonical URL |
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 client ID from Google Console |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 client secret from Google Console |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |

---

## Project Structure

```
/app
  /(auth)/login            Login page (Credentials + Google)
  /(auth)/register         Registration page
  /dashboard               Auth-gated favourites dashboard
  /api/auth/[...nextauth]  NextAuth route handler
  /api/favorites           GET list + POST create
  /api/favorites/[id]      DELETE remove
  /actions/auth.ts         registerUser server action
  layout.tsx               Root layout (Providers, Toaster)
  page.tsx                 Homepage (Suspense shell)
  HomeClient.tsx           Interactive page client

/components
  /map
    GlobeMap.tsx           MapLibre full-viewport map + flyTo
    PulsingMarker.tsx      Framer Motion animated marker
  /search
    CountryBar.tsx         Debounced country autocomplete (ARIA combobox)
    CityBar.tsx            Debounced city autocomplete (ARIA combobox)
  /weather
    WeatherCard.tsx        Glassmorphic card, Recharts 24h chart, SaveButton
    LiveClock.tsx          Ticking Intl.DateTimeFormat clock
    WeatherEffects.tsx     CSS/FM rain, snow, sun, thunder overlays
  /ui
    button.tsx, input.tsx
    error-boundary.tsx
  providers.tsx            SessionProvider wrapper

/lib
  auth.ts                  NextAuth v5 full config (Prisma adapter + Credentials)
  auth.config.ts           Edge-safe config used by proxy.ts
  db.ts                    Prisma client singleton
  locationContext.tsx      Selected location shared state
  weatherContext.tsx       Weather fetch + shared state
  openMeteo.ts             Open-Meteo weather API client
  geocoding.ts             Open-Meteo geocoding API client
  weatherCodes.ts          WMO code → label / emoji / effect type
  useDebounce.ts           Generic debounce hook
  utils.ts                 cn() Tailwind merge helper

/prisma
  schema.prisma            User, Account, Session, VerificationToken, FavoriteLocation
  seed.ts                  Seeds 3 demo locations for demo@liveatlas.app

/types
  next-auth.d.ts           Session.user.id type augmentation
```

---

## QA Checklist

- [ ] Map loads on `/`, shows dark globe
- [ ] Country search: type "Fra" → France appears in dropdown
- [ ] City search: type "Par" with France selected → Paris, France; selecting flies the map there in ~3 s
- [ ] Pulsing blue marker appears at destination
- [ ] Weather card appears with temperature, condition emoji, humidity, wind, 24 h chart
- [ ] Live clock shows correct local time for the city, ticks every second
- [ ] Weather animation effect matches the condition (rain streaks, snow drift, sun glow…)
- [ ] Arrow keys navigate the autocomplete dropdown; Enter selects; Escape closes
- [ ] `/login` form validates inline (Zod), Google button redirects to OAuth
- [ ] `/register` password-match validation works; success redirects to login with toast
- [ ] Logged-in user sees ★ on the weather card
- [ ] ★ saves the location → turns yellow → toast confirms
- [ ] ★ again removes it → turns grey → toast confirms
- [ ] `/dashboard` shows saved locations with "Fly to" and ✕ delete
- [ ] "Fly to" navigates to `/` and the map flies to that location
- [ ] ✕ delete removes the row (server revalidates the page)
- [ ] Sign out redirects to `/`
- [ ] Unauthenticated `/dashboard` → 307 redirect to `/login`
- [ ] Mobile (375 px): header shows two rows, weather card is full-width at bottom
