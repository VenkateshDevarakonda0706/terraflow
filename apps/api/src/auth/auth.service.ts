import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@terraflow/database';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  declare private jwtService: JwtService;

  constructor(@Inject(JwtService) jwtService: JwtService) {
    // Validate required environment variables at service initialization
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
    this.jwtService = jwtService;
  }

  async register(dto: { email: string; username: string; name: string; password?: string }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { username: dto.username }
        ]
      }
    });

    if (existing) {
      throw new ConflictException('Email or username is already registered');
    }

    let passwordHash = null;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        name: dto.name,
        passwordHash,
        travelStats: {
          create: {
            countriesVisited: [],
            citiesVisited: [],
            totalDistanceKm: 0.0,
            travelStreak: 0,
            unlockedBadges: [],
          }
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
      }
    });

    return user;
  }

  async login(dto: { identifier: string; password?: string }) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.identifier },
          { username: dto.identifier }
        ]
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.passwordHash && dto.password) {
      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses Social Login. Please login via Google or Apple.');
    }

    return this.generateAuthTokens(user);
  }

  async validateSocialUser(dto: { email: string; name: string; profilePic?: string; username: string }) {
    let user = await prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user) {
      // Ensure unique username
      let finalUsername = dto.username;
      const count = await prisma.user.count({ where: { username: finalUsername } });
      if (count > 0) {
        finalUsername = `${dto.username}_${Math.floor(Math.random() * 1000)}`;
      }

      user = await prisma.user.create({
        data: {
          email: dto.email,
          username: finalUsername,
          name: dto.name,
          profilePic: dto.profilePic,
          travelStats: {
            create: {
              countriesVisited: [],
              citiesVisited: [],
              totalDistanceKm: 0.0,
              travelStreak: 0,
              unlockedBadges: [],
            }
          }
        }
      });
    } else {
      // Dynamic profile updates
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: dto.name,
          profilePic: dto.profilePic || user.profilePic,
        }
      });
    }

    return this.generateAuthTokens(user);
  }

  private generateAuthTokens(user: { id: string; email: string; username: string; name: string; profilePic?: string | null }) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        profilePic: user.profilePic,
      },
      accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: string) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        travelStats: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    return profile;
  }
  async updateProfile(userId: string, data: { name?: string; bio?: string; profilePic?: string }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name      ? { name: data.name }           : {}),
        ...(data.bio       !== undefined ? { bio: data.bio } : {}),
        ...(data.profilePic ? { profilePic: data.profilePic } : {}),
      },
      select: {
        id: true, email: true, username: true,
        name: true, bio: true, profilePic: true,
      },
    });
    return updated;
  }

  async getPublicProfile(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, name: true,
        bio: true, profilePic: true, createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
        posts: {
          where: { visibility: 'PUBLIC' },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { media: true },
        },
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }
}
