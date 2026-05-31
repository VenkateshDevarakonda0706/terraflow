import { PostsService } from './posts.service.js';
import { prisma } from '@terraflow/database';
import * as h3 from 'h3-js';

jest.mock('@terraflow/database', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    travelStats: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    }
  },
}));

describe('Terraflow Spatial Engine & Privacy Interceptor Integration Suite', () => {
  let postsService: PostsService;

  beforeEach(() => {
    postsService = new PostsService();
    jest.clearAllMocks();
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

      (prisma.post.create as jest.Mock).mockResolvedValue({
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

      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const result = await postsService.explore(mockQuery);
      expect(result.type).toBe('CLUSTERS');
      
      const clusters = (result as any).clusters;
      expect(clusters.length).toBe(1); // Groups both points into a single parent cell
      expect(clusters[0].count).toBe(2);
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
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      const result = await postsService.explore(mockQuery);
      expect(result.type).toBe('POSTS');
      expect((result as any).posts.length).toBe(0); // Query blocks unauthorized friends posts from anonymous viewers
      
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
});
