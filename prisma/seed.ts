import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const DEMO_LOCATIONS = [
  {
    name: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
  },
  {
    name: 'Paris',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
  },
  {
    name: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
  },
];

async function main() {
  const user = await db.user.upsert({
    where: { email: 'demo@liveatlas.app' },
    update: {},
    create: { name: 'Demo User', email: 'demo@liveatlas.app' },
  });

  // Clear previous seed data for this user then recreate
  await db.favoriteLocation.deleteMany({ where: { userId: user.id } });
  await db.favoriteLocation.createMany({
    data: DEMO_LOCATIONS.map((loc) => ({ ...loc, userId: user.id })),
  });

  console.log(`✓ Seeded 3 demo locations for ${user.email}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
