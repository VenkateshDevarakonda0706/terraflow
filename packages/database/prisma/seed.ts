import { PrismaClient, Visibility, MediaType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as h3 from 'h3-js';
import dotenv from 'dotenv';
import path from 'path';
import { latLngToCell } from 'h3-js';

// Load environment variables from the monorepo root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

/**
 * Helper to calculate the Uber H3 index at resolution 8,
 * matching the resolution used in the API (posts.service.ts).
 */
function getH3Index(lat: number, lng: number): string {
  return latLngToCell(lat, lng, 8);
}

async function main() {
  console.log('[Seed] Starting database seeding...');

  // 1. Password hashing for a default test password
  // WARNING: This password is for local development only.
  // Never use this credential in staging or production.
  const defaultPassword = 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // Hardcoded Demo User Definitions
  const demoUsers = [
    {
      id: 'user-demo-maya',
      email: 'maya@example.com',
      username: 'maya',
      name: 'Maya',
      bio: 'Explorer and photographer. Finding quiet corners of the world.',
      profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
      travelStats: {
        countriesVisited: ['US'],
        citiesVisited: ['Yosemite'],
        totalDistanceKm: 450.0,
        travelStreak: 1,
        unlockedBadges: ['EXPLORER'],
      },
    },
    {
      id: 'user-demo-ren',
      email: 'ren@example.com',
      username: 'ren',
      name: 'Ren',
      bio: 'Traveler and coffee enthusiast. Path of wet stones and temple bells.',
      profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      travelStats: {
        countriesVisited: ['JP'],
        citiesVisited: ['Kyoto'],
        totalDistanceKm: 450.0,
        travelStreak: 1,
        unlockedBadges: ['EXPLORER'],
      },
    },
    {
      id: 'user-demo-amina',
      email: 'amina@example.com',
      username: 'amina',
      name: 'Amina',
      bio: 'Seeking sunrises from above. Hot air balloons and early mornings.',
      profilePic: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
      travelStats: {
        countriesVisited: ['TR'],
        citiesVisited: ['Cappadocia'],
        totalDistanceKm: 450.0,
        travelStreak: 1,
        unlockedBadges: ['EXPLORER'],
      },
    },
  ];

  // Hardcoded Demo Post Definitions
  const demoPosts = [
    {
      id: 'demo-yosemite',
      userId: 'user-demo-maya',
      title: 'Morning light over the valley',
      description: 'A quiet sunrise walk before the trail filled with people.',
      latitude: 37.8651,
      longitude: -119.5383,
      tags: ['nature', 'sunrise', 'california'],
      visibility: Visibility.PUBLIC,
      mediaUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'demo-kyoto',
      userId: 'user-demo-ren',
      title: 'Rain on the old stone path',
      description: 'Temple bells, wet stone, and a tiny tea shop at the corner.',
      latitude: 35.0116,
      longitude: 135.7681,
      tags: ['city', 'rain', 'japan'],
      visibility: Visibility.PUBLIC,
      mediaUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'demo-cappadocia',
      userId: 'user-demo-amina',
      title: 'Balloons before breakfast',
      description: 'The whole horizon lifted slowly while the town was still asleep.',
      latitude: 38.6431,
      longitude: 34.8289,
      tags: ['travel', 'dawn', 'turkey'],
      visibility: Visibility.PUBLIC,
      mediaUrl: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  /**
   * Idempotency Strategy:
   * To ensure the seed script can be run repeatedly without duplicating or corrupting data,
   * we target only the specific demo records by their hardcoded IDs.
   * 1. Delete demo posts by their specific IDs.
   * 2. Delete demo users by their specific IDs.
   * Due to schema onDelete: Cascade constraints, linked records (like Media, TravelStats) are automatically cleaned up.
   * 3. Re-create the demo users, their travel stats, and their corresponding demo posts/media with static IDs.
   * This isolates the seed actions to the demo namespace, preserving any developer-created data.
   */
  const demoPostIds = demoPosts.map(p => p.id);
  const demoUserIds = demoUsers.map(u => u.id);

  console.log('[Seed] Cleaning up any existing demo records for idempotency...');

  await prisma.post.deleteMany({
    where: { id: { in: demoPostIds } },
  });

  await prisma.user.deleteMany({
    where: { id: { in: demoUserIds } },
  });

  console.log('[Seed] Creating demo users...');
  for (const user of demoUsers) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profilePic: user.profilePic,
        passwordHash,
        travelStats: {
          create: {
            countriesVisited: user.travelStats.countriesVisited,
            citiesVisited: user.travelStats.citiesVisited,
            totalDistanceKm: user.travelStats.totalDistanceKm,
            travelStreak: user.travelStats.travelStreak,
            unlockedBadges: user.travelStats.unlockedBadges,
          },
        },
      },
    });
    console.log(` - Created user: ${user.username}`);
  }

  console.log('[Seed] Creating demo posts and media...');
  for (const post of demoPosts) {
    const h3Index = getH3Index(post.latitude, post.longitude);

    await prisma.post.create({
      data: {
        id: post.id,
        userId: post.userId,
        title: post.title,
        description: post.description,
        latitude: post.latitude,
        longitude: post.longitude,
        h3Index,
        tags: post.tags,
        visibility: post.visibility,
        media: {
          create: {
            url: post.mediaUrl,
            type: MediaType.IMAGE,
            order: 0,
          },
        },
      },
    });
    console.log(` - Created post: "${post.title}" (H3 Index: ${h3Index})`);
  }

  console.log('[Seed] Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
