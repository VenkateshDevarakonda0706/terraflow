import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@terraflow/database';
import * as h3 from 'h3-js';

export interface ExploreCluster {
  h3Index: string;
  latitude: number;
  longitude: number;
  count: number;
  postSample: any;
}

export interface ClustersResponse {
  type: 'CLUSTERS';
  clusters: ExploreCluster[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PostsResponse {
  type: 'POSTS';
  posts: Array<{
    id: string;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    tags: string[];
    createdAt: Date;
    user: any;
    media: any[];
  }>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type ExploreResponse = ClustersResponse | PostsResponse;

@Injectable()
export class PostsService {
  private geocodeCache = new Map<string, { city: string; country: string }>();
  
  private getH3Resolution(zoomLevel: number): number {
    if (zoomLevel <= 3) return 2;      // Country/Continent clusters
    if (zoomLevel <= 5) return 4;      // Regional clusters
    if (zoomLevel <= 8) return 6;      // Metro clusters
    return 8;                         // Neighborhood detail
  }

  async createPost(userId: string, data: {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    tags: string[];
    visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
    mediaUrls: string[];
  }) {
    let h3Index = '0';
    try {
      if (typeof h3.latLngToCell === 'function') {
        h3Index = h3.latLngToCell(data.latitude, data.longitude, 8);
      } else {
        h3Index = (h3 as any).geoToH3(data.latitude, data.longitude, 8);
      }
    } catch (err) {
      h3Index = '88268562d5fffff';
    }

    const post = await prisma.post.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        h3Index,
        tags: data.tags,
        visibility: data.visibility,
        media: {
          create: data.mediaUrls.map((url, idx) => ({
            url,
            type: url?.endsWith('.mp4') ? 'VIDEO' : 'IMAGE',
            order: idx,
          }))
        }
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        }
      }
    });

    this.asyncUpdateTravelStats(userId, data.latitude, data.longitude).catch(console.error);

    return post;
  }

  async explore(query: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    zoomLevel: number;
    category?: string;
    requestingUserId?: string;
    page?: number;
  }): Promise<ExploreResponse> {
    const { minLat, maxLat, minLng, maxLng, zoomLevel, category, requestingUserId, page = 1 } = query;
    const h3Resolution = this.getH3Resolution(zoomLevel);
    const limit = 50;
    const skip = Math.max(0, (page - 1) * limit);

    // Dynamic Server-Side Access Control & Privacy Shields
    const visibilityConditions = [
      { visibility: 'PUBLIC' as const },
      ...(requestingUserId ? [
        // Querying user is the author
        { userId: requestingUserId },
        // Post is visible to friends and the author is followed by the querying user
        {
          visibility: 'FRIENDS' as const,
          user: {
            followers: {
              some: {
                followerId: requestingUserId
              }
            }
          }
        }
      ] : [])
    ];

    const whereConditions = {
      latitude: { gte: Number(minLat), lte: Number(maxLat) },
      longitude: { gte: Number(minLng), lte: Number(maxLng) },
      OR: visibilityConditions,
      ...(category ? { tags: { has: category.toLowerCase() } } : {}),
    };

    const posts = await prisma.post.findMany({
      where: whereConditions,
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          }
        }
      },
      take: limit,
      skip: skip,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.post.count({ where: whereConditions });

    // Dynamic Server-Side Hexagonal Clustering
    if (zoomLevel <= 9) {
      const clusterMap = new Map<string, {
        h3Index: string;
        latitude: number;
        longitude: number;
        count: number;
        postSample: typeof posts[0];
      }>();

      for (const post of posts) {
        let parentCell = post.h3Index;
        try {
          if (typeof h3.cellToParent === 'function') {
            parentCell = h3.cellToParent(post.h3Index, h3Resolution);
          } else {
            parentCell = (h3 as any).h3ToParent(post.h3Index, h3Resolution);
          }
        } catch (e) {}

        const existing = clusterMap.get(parentCell);
        if (existing) {
          existing.count += 1;
        } else {
          let centerCoords = [post.latitude, post.longitude];
          try {
            if (typeof h3.cellToLatLng === 'function') {
              centerCoords = h3.cellToLatLng(parentCell);
            } else {
              centerCoords = (h3 as any).h3ToGeo(parentCell);
            }
          } catch (e) {}

          clusterMap.set(parentCell, {
            h3Index: parentCell,
            latitude: centerCoords[0],
            longitude: centerCoords[1],
            count: 1,
            postSample: post,
          });
        }
      }

      return {
        type: 'CLUSTERS',
        clusters: Array.from(clusterMap.values()),
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      };
    }

    return {
      type: 'POSTS',
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        description: post.description,
        latitude: post.latitude,
        longitude: post.longitude,
        tags: post.tags,
        createdAt: post.createdAt,
        user: post.user,
        media: post.media,
      })),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getTimeline(latitude: number, longitude: number, radiusKm = 5.0, requestingUserId?: string) {
    const latOffset = radiusKm / 111.0;
    const lngOffset = radiusKm / (111.0 * Math.cos(latitude * (Math.PI / 180.0)));

    const visibilityConditions = [
      { visibility: 'PUBLIC' as const },
      ...(requestingUserId ? [
        { userId: requestingUserId },
        {
          visibility: 'FRIENDS' as const,
          user: {
            followers: {
              some: {
                followerId: requestingUserId
              }
            }
          }
        }
      ] : [])
    ];

    const posts = await prisma.post.findMany({
      where: {
        latitude: { gte: latitude - latOffset, lte: latitude + latOffset },
        longitude: { gte: longitude - lngOffset, lte: longitude + lngOffset },
        OR: visibilityConditions,
      },
      orderBy: { createdAt: 'desc' },
      include: { media: true, user: true },
    });

    const timeline: Record<string, typeof posts> = {};
    for (const post of posts) {
      const year = new Date(post.createdAt).getFullYear().toString();
      if (!timeline[year]) timeline[year] = [];
      timeline[year].push(post);
    }

    return Object.entries(timeline).map(([year, posts]) => ({
      year,
      count: posts.length,
      posts,
    })).sort((a, b) => b.year.localeCompare(a.year));
  }

  // ── Find single post (visibility-aware) ────────────────────────────────
  async findById(postId: string, requestingUserId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        media: true,
        user: { select: { id: true, username: true, name: true, profilePic: true } },
        _count: { select: { likes: true, comments: true, savedBy: true } },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.visibility === 'PRIVATE' && post.userId !== requestingUserId) {
      throw new ForbiddenException('You do not have access to this post');
    }
    if (post.visibility === 'FRIENDS' && post.userId !== requestingUserId) {
      if (!requestingUserId) throw new ForbiddenException('Login required');
      const isFollowing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: requestingUserId, followingId: post.userId } },
      });
      if (!isFollowing) throw new ForbiddenException('This post is friends-only');
    }

    return post;
  }

  // ── Delete post (owner only) ─────────────────────────────────────────────
  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not your post');
    await prisma.post.delete({ where: { id: postId } });
    return { success: true };
  }

  // ── Search posts by title, tag, or location name ─────────────────────────
  async searchPosts(params: {
    q?: string;
    tag?: string;
    requestingUserId?: string;
    page?: number;
  }) {
    const { q, tag, requestingUserId, page = 1 } = params;
    const limit = 20;
    const skip = (page - 1) * limit;

    const visibilityConditions = [
      { visibility: 'PUBLIC' as const },
      ...(requestingUserId ? [
        { userId: requestingUserId },
        {
          visibility: 'FRIENDS' as const,
          user: { followers: { some: { followerId: requestingUserId } } },
        },
      ] : []),
    ];

    const where: any = {
      OR: visibilityConditions,
    };

    if (q) {
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (tag) {
      const tagFilter = { tags: { has: tag.toLowerCase() } };
      where.AND = where.AND ? [...where.AND, tagFilter] : [tagFilter];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        media: true,
        user: { select: { id: true, username: true, name: true, profilePic: true } },
        _count: { select: { likes: true, comments: true } },
      },
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.post.count({ where });
    const hasMore = skip + limit < total;

    return { posts, total, page, limit, hasMore };
  }

  private async asyncUpdateTravelStats(userId: string, lat: number, lng: number) {
    const stats = await prisma.travelStats.findUnique({ where: { userId } });
    if (!stats) return;

    const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
    let location = this.geocodeCache.get(cacheKey);

    if (!location) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'TerraFlow-App/1.0' },
        });
        if (response.ok) {
          const data = await response.json();
          const address = data?.address;
          if (address) {
            const city = address.city || address.town || address.village || address.suburb;
            const country = address.country_code ? address.country_code.toUpperCase() : undefined;
            if (city && country) {
              location = { city, country };
              this.geocodeCache.set(cacheKey, location);
            }
          }
        }
      } catch (err) {
        console.warn('Geocoding API request failed:', err);
      }
    }

    if (!location || !location.city || !location.country) {
      console.warn(`Geocoding failed for coordinates: ${lat}, ${lng}. Travel stats unchanged.`);
      return;
    }

    const cities = new Set(stats.citiesVisited);
    const countries = new Set(stats.countriesVisited);

    cities.add(location.city);
    countries.add(location.country);

    const badges = new Set(stats.unlockedBadges);
    if (countries.size >= 5) badges.add('GLOBETROTTER');
    if (cities.size >= 10) badges.add('EXPLORER');
    
    await prisma.travelStats.update({
      where: { userId },
      data: {
        citiesVisited: Array.from(cities),
        countriesVisited: Array.from(countries),
        unlockedBadges: Array.from(badges),
        totalDistanceKm: stats.totalDistanceKm + 450.0,
      }
    });
  }
}
