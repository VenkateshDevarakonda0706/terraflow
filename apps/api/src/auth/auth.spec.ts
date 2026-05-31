import { AuthService } from './auth.service.js';
import { GoogleStrategy } from './google.strategy.js';
import { AppleStrategy } from './apple.strategy.js';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@terraflow/database';

jest.mock('@terraflow/database', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Terraflow Authentication Unit & Integration Suite', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test-secret' });
    authService = new AuthService(jwtService);
    jest.clearAllMocks();
  });

  describe('AuthService Credentials Registration', () => {
    it('should successfully register a new user and initialize travel stats parameters', async () => {
      const mockDto = {
        email: 'traveler@terraflow.com',
        username: 'traveler',
        name: 'Jane Doe',
        password: 'securePassword123',
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'mock-user-uuid',
        email: mockDto.email,
        username: mockDto.username,
        name: mockDto.name,
      });

      const result = await authService.register(mockDto);
      expect(result).toBeDefined();
      expect(result.email).toBe(mockDto.email);
      expect(result.username).toBe(mockDto.username);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: mockDto.email,
            username: mockDto.username,
            name: mockDto.name,
            travelStats: expect.objectContaining({
              create: expect.objectContaining({
                countriesVisited: expect.any(Array),
                citiesVisited: expect.any(Array),
                totalDistanceKm: 0.0,
              }),
            }),
          }),
        })
      );
    });
  });

  describe('AuthService Google OAuth Social Validator', () => {
    it('should upsert an existing Google social account without duplicating usernames', async () => {
      const mockSocialPayload = {
        email: 'explorer@gmail.com',
        name: 'John Explorer',
        profilePic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
        username: 'explorer',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-uuid',
        email: mockSocialPayload.email,
        username: 'explorer_google',
        name: 'John Explorer',
        profilePic: null,
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'existing-uuid',
        email: mockSocialPayload.email,
        username: 'explorer_google',
        name: 'John Explorer',
        profilePic: mockSocialPayload.profilePic,
      });

      const result = await authService.validateSocialUser(mockSocialPayload);
      expect(result.accessToken).toBeDefined();
      expect(result.user.id).toBe('existing-uuid');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-uuid' },
          data: {
            name: mockSocialPayload.name,
            profilePic: mockSocialPayload.profilePic,
          },
        })
      );
    });
  });

  describe('GoogleStrategy Dynamic Environment Fallbacks', () => {
    it('should initialize and establish fallback logs warning when stub environments are found', () => {
      const loggerSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      process.env.GOOGLE_CLIENT_ID = 'google-client-id-placeholder-obtain-from-console';
      process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret-placeholder';
      
      const strategy = new GoogleStrategy();
      expect(strategy).toBeDefined();
      expect(loggerSpy).toHaveBeenCalled();
      
      loggerSpy.mockRestore();
    });
  });

  describe('AppleStrategy Disabled-by-Default Gates', () => {
    it('should throw ServiceUnavailableException if variables are missing, locking Apple sign-in by default', () => {
      process.env.APPLE_CLIENT_ID = 'apple-client-id-placeholder';
      process.env.APPLE_TEAM_ID = 'apple-team-id-placeholder';

      const strategy = new AppleStrategy();
      expect(() => strategy.validateAppleGate()).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Apple Sign-In is currently disabled'),
        })
      );
    });
  });
});
