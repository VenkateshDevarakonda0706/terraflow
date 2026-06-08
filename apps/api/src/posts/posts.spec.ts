import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { PostsService } from './posts.service.js';
import { PostsController } from './posts.controller.js';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import { prisma } from '@terraflow/database';
import { UnauthorizedException } from '@nestjs/common';
import * as h3 from 'h3-js';

vi.mock('@terraflow/database', () => ({
  prisma: {
    post: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    travelStats: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    }
  },
}));

describe('Terraflow Spatial Engine & Privacy Interceptor Integration Suite', () => {
  let postsService: PostsService;

  beforeEach(() => {
    postsService = new PostsService();
    vi.clearAllMocks();
  });

  describe('PostsService H3 Index Post Creation', () => {
    it('should successfully index posts utilizing Uber H3 latLngToCell resolution 8 grids', async () => {
      const mockDto = {
        title: 'Eiffel Tower View',
        latitude: 48.8584,
        longitude: 2.2945,
        tags: ['travel', 'paris'],
        visibility: 'PUBLIC' as const,
        mediaUrls: ['https://images.unsplash.com/paris-scenic.jpeg'],
      };

      (prisma.post.create as Mock).mockResolvedValue({
        id: 'post-uuid-paris',
        userId: 'user-uuid-1',
        title: mockDto.title,
        latitude: mockDto.latitude,
        longitude: mockDto.longitude,
        h3Index: '88268562d5fffff', // Eiffel tower resolved cell index
        visibility: mockDto.visibility,
      });

      const result = await postsService.createPost('user-uuid-1', mockDto);
      expect(result).toBeDefined();
      expect(result.id).toBe('post-uuid-paris');
      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid-1',
            title: mockDto.title,
            latitude: mockDto.latitude,
            longitude: mockDto.longitude,
            h3Index: expect.stringMatching(/^[89][0-9a-f]{14}$/i), // Matches 15-char H3 index pattern
            visibility: mockDto.visibility,
          }),
        })
      );
    });
  });

  describe('PostsService Dynamic Server-Side Hexagonal Clustering', () => {
    it('should aggregate multiple points into a single coordinate cluster at global zoom elevations', async () => {
      const mockQuery = {
        minLat: 10.0,
        maxLat: 60.0,
        minLng: 2.0,
        maxLng: 80.0,
        zoomLevel: 2, // Very zoomed out
      };

      const mockPosts = [
        {
          id: 'post-1',
          latitude: 48.8584,
          longitude: 2.2945,
          h3Index: '88268562d5fffff',
          visibility: 'PUBLIC' as const,
          user: { username: 'user1', name: 'User One', profilePic: null },
          media: [],
        },
        {
          id: 'post-2',
          latitude: 48.8500,
          longitude: 2.3000,
          h3Index: '88268562d5fffff', // Same hexagonal cell area
          visibility: 'PUBLIC' as const,
          user: { username: 'user2', name: 'User Two', profilePic: null },
          media: [],
        }
      ];

      (prisma.post.findMany as Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as Mock).mockResolvedValue(mockPosts.length);

      const result = await postsService.explore(mockQuery);
      expect(result.type).toBe('CLUSTERS');
      
      if (result.type === 'CLUSTERS') {
        expect(result.clusters.length).toBe(1); // Groups both points into a single parent cell
        expect(result.clusters[0].count).toBe(2);
      }
    });
  });

  describe('PostsService Spatiotemporal Server-Side Privacy Protections', () => {
    it('should enforce that FRIENDS visibility posts are gated and excluded if follows are missing', async () => {
      const mockQuery = {
        minLat: 10.0,
        maxLat: 60.0,
        minLng: 2.0,
        maxLng: 80.0,
        zoomLevel: 12, // Zoomed in to raw detailed view
        requestingUserId: 'anonymous-visitor-uuid',
      };

      // Mocks database queries where privacy checks are run inside OR clauses
      (prisma.post.findMany as Mock).mockResolvedValue([]);
      (prisma.post.count as Mock).mockResolvedValue(0);

      const result = await postsService.explore(mockQuery);
      expect(result.type).toBe('POSTS');
      if (result.type === 'POSTS') {
        expect(result.posts.length).toBe(0); // Query blocks unauthorized friends posts from anonymous viewers
      }
      
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { visibility: 'PUBLIC' },
              expect.objectContaining({
                visibility: 'FRIENDS',
                user: expect.objectContaining({
                  followers: expect.objectContaining({
                    some: { followerId: 'anonymous-visitor-uuid' }
                  })
                })
              })
            ])
          })
        })
      );
    });
  });

  describe('PostsService Search Pagination Metadata', () => {
    it('should return page, limit, total from count(), and hasMore on first page', async () => {
      const mockPosts = Array.from({ length: 20 }, (_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        description: null,
        latitude: 48.8584,
        longitude: 2.2945,
        h3Index: '88268562d5fffff',
        tags: ['travel'],
        visibility: 'PUBLIC' as const,
        createdAt: new Date(),
        user: { id: 'u1', username: 'user1', name: 'User', profilePic: null },
        media: [],
        _count: { likes: 0, comments: 0 },
      }));

      (prisma.post.findMany as Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as Mock).mockResolvedValue(45);

      const result = await postsService.searchPosts({ q: 'Post', page: 1 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(45);
      expect(result.hasMore).toBe(true);
      expect(result.posts).toHaveLength(20);
      expect(prisma.post.count).toHaveBeenCalled();
    });

    it('should return hasMore false when on the last page', async () => {
      const mockPosts = Array.from({ length: 5 }, (_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        description: null,
        latitude: 48.8584,
        longitude: 2.2945,
        h3Index: '88268562d5fffff',
        tags: ['travel'],
        visibility: 'PUBLIC' as const,
        createdAt: new Date(),
        user: { id: 'u1', username: 'user1', name: 'User', profilePic: null },
        media: [],
        _count: { likes: 0, comments: 0 },
      }));

      (prisma.post.findMany as Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as Mock).mockResolvedValue(25);

      const result = await postsService.searchPosts({ q: 'Post', page: 2 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(25);
      expect(result.hasMore).toBe(false);
      expect(result.posts).toHaveLength(5);
    });
  });

  describe('PostsService Explore Pagination Metadata', () => {
    const baseQuery = {
      minLat: 10.0,
      maxLat: 60.0,
      minLng: 2.0,
      maxLng: 80.0,
    };

    it('should include page and limit in CLUSTERS response with hasMore true', async () => {
      const mockPosts = Array.from({ length: 50 }, (_, i) => ({
        id: `post-${i}`,
        latitude: 48.8584,
        longitude: 2.2945,
        h3Index: '88268562d5fffff',
        visibility: 'PUBLIC' as const,
        user: { username: 'user1', name: 'User', profilePic: null },
        media: [],
      }));

      (prisma.post.findMany as Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as Mock).mockResolvedValue(120);

      const result = await postsService.explore({ ...baseQuery, zoomLevel: 2, page: 1 });

      expect(result.type).toBe('CLUSTERS');
      expect(result.total).toBe(120);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.hasMore).toBe(true);
    });

    it('should include page and limit in POSTS response with hasMore false on last page', async () => {
      const mockPosts = Array.from({ length: 10 }, (_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        description: null,
        latitude: 48.8584,
        longitude: 2.2945,
        h3Index: '88268562d5fffff',
        tags: ['travel'],
        visibility: 'PUBLIC' as const,
        createdAt: new Date(),
        user: { username: 'user1', name: 'User', profilePic: null },
        media: [],
      }));

      (prisma.post.findMany as Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as Mock).mockResolvedValue(60);

      const result = await postsService.explore({ ...baseQuery, zoomLevel: 12, page: 2 });

      expect(result.type).toBe('POSTS');
      expect(result.total).toBe(60);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.hasMore).toBe(false);
    });
  });
});

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  it('should return null when no token is provided', () => {
    const mockRequest = { headers: {} };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    const result = guard.handleRequest(null, null, null, mockContext);
    expect(result).toBeNull();
  });

  it('should return user when valid token is provided', () => {
    const mockRequest = { headers: { authorization: 'Bearer valid-token' } };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
    const mockUser = { id: 'user-uuid-1', email: 'test@example.com' };

    const result = guard.handleRequest(null, mockUser, null, mockContext);
    expect(result).toBe(mockUser);
  });

  it('should throw UnauthorizedException when invalid token is provided', () => {
    const mockRequest = { headers: { authorization: 'Bearer invalid-token' } };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    expect(() => {
      guard.handleRequest(null, null, new Error('Invalid signature'), mockContext);
    }).toThrow(UnauthorizedException);
  });
});

describe('PostsController Optional Context Routing', () => {
  let controller: PostsController;
  let mockPostsService: any;
  let mockStorageService: any;

  beforeEach(() => {
    mockPostsService = {
      searchPosts: vi.fn(),
      explore: vi.fn(),
      getTimeline: vi.fn(),
      findById: vi.fn(),
    };
    mockStorageService = {};
    controller = new PostsController(mockPostsService, mockStorageService);
  });

  it('should pass requestingUserId as undefined for anonymous requests', async () => {
    const mockReq = { user: null };
    
    mockPostsService.explore.mockResolvedValue({ type: 'POSTS', posts: [] });
    await controller.explore(mockReq, { minLat: '0', maxLat: '10', minLng: '0', maxLng: '10', zoom: '2' });
    expect(mockPostsService.explore).toHaveBeenCalledWith(
      expect.objectContaining({ requestingUserId: undefined })
    );

    mockPostsService.searchPosts.mockResolvedValue({ posts: [] });
    await controller.search(mockReq, 'query');
    expect(mockPostsService.searchPosts).toHaveBeenCalledWith(
      expect.objectContaining({ requestingUserId: undefined })
    );

    mockPostsService.getTimeline.mockResolvedValue([]);
    await controller.getTimeline(mockReq, 10, 20);
    expect(mockPostsService.getTimeline).toHaveBeenCalledWith(
      10, 20, 5, undefined
    );

    mockPostsService.findById.mockResolvedValue({});
    await controller.getOne(mockReq, 'post-id');
    expect(mockPostsService.findById).toHaveBeenCalledWith(
      'post-id', undefined
    );
  });

  it('should pass requestingUserId as the user ID for authenticated requests', async () => {
    const mockReq = { user: { id: 'user-uuid-1' } };
    
    mockPostsService.explore.mockResolvedValue({ type: 'POSTS', posts: [] });
    await controller.explore(mockReq, { minLat: '0', maxLat: '10', minLng: '0', maxLng: '10', zoom: '2' });
    expect(mockPostsService.explore).toHaveBeenCalledWith(
      expect.objectContaining({ requestingUserId: 'user-uuid-1' })
    );

    mockPostsService.searchPosts.mockResolvedValue({ posts: [] });
    await controller.search(mockReq, 'query');
    expect(mockPostsService.searchPosts).toHaveBeenCalledWith(
      expect.objectContaining({ requestingUserId: 'user-uuid-1' })
    );

    mockPostsService.getTimeline.mockResolvedValue([]);
    await controller.getTimeline(mockReq, 10, 20);
    expect(mockPostsService.getTimeline).toHaveBeenCalledWith(
      10, 20, 5, 'user-uuid-1'
    );

    mockPostsService.findById.mockResolvedValue({});
    await controller.getOne(mockReq, 'post-id');
    expect(mockPostsService.findById).toHaveBeenCalledWith(
      'post-id', 'user-uuid-1'
    );
  });
});
