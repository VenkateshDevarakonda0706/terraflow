import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ModerationService } from './moderation.service.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { prisma } from '@terraflow/database';

vi.mock('@terraflow/database', () => {
  const mockPrisma = {
    report: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

describe('Moderation Service & RolesGuard Suite', () => {
  let moderationService: ModerationService;

  beforeEach(() => {
    moderationService = new ModerationService();
    vi.clearAllMocks();
  });

  describe('ModerationService.getReports()', () => {
    it('should return reports with reporter and post details', async () => {
      const mockReports = [
        {
          id: 'report-1',
          reason: 'Spam',
          status: 'PENDING',
          reporter: { id: 'u1', username: 'reporter1' },
          post: { id: 'p1', title: 'Post title' },
        },
      ];

      (prisma.report.findMany as Mock).mockResolvedValue(mockReports);

      const result = await moderationService.getReports();
      expect(result).toEqual(mockReports);
      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            reporter: expect.any(Object),
            post: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('ModerationService.updateReportStatus()', () => {
    it('should update status and mark post as moderated when status is RESOLVED', async () => {
      const mockReport = {
        id: 'report-1',
        postId: 'post-1',
        reason: 'Spam',
        status: 'PENDING',
      };

      (prisma.report.findUnique as Mock).mockResolvedValue(mockReport);
      (prisma.report.update as Mock).mockResolvedValue({
        ...mockReport,
        status: 'RESOLVED',
      });

      const result = await moderationService.updateReportStatus('report-1', 'RESOLVED');

      expect(result.status).toBe('RESOLVED');
      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { status: 'RESOLVED' },
      });
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { isModerated: true },
      });
    });

    it('should update status but NOT mark post as moderated when status is other than RESOLVED', async () => {
      const mockReport = {
        id: 'report-1',
        postId: 'post-1',
        reason: 'Spam',
        status: 'PENDING',
      };

      (prisma.report.findUnique as Mock).mockResolvedValue(mockReport);
      (prisma.report.update as Mock).mockResolvedValue({
        ...mockReport,
        status: 'REVIEWED',
      });

      const result = await moderationService.updateReportStatus('report-1', 'REVIEWED');

      expect(result.status).toBe('REVIEWED');
      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { status: 'REVIEWED' },
      });
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if report does not exist', async () => {
      (prisma.report.findUnique as Mock).mockResolvedValue(null);

      await expect(
        moderationService.updateReportStatus('invalid-id', 'RESOLVED')
      ).rejects.toThrow('Report not found');
    });
  });

  describe('RolesGuard Authorization', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    const createMockContext = (role?: string, userExists = true) => {
      const request = userExists ? { user: { role } } : {};
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;
    };

    beforeEach(() => {
      reflector = {
        getAllAndOverride: vi.fn(),
      } as any;
      guard = new RolesGuard(reflector);
    });

    it('should allow access if no roles are required', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);
      const context = createMockContext('USER');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if user has USER role and route requires MODERATOR or ADMIN', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(['MODERATOR', 'ADMIN']);
      const context = createMockContext('USER');
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should allow access if user has MODERATOR role and route requires MODERATOR or ADMIN', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(['MODERATOR', 'ADMIN']);
      const context = createMockContext('MODERATOR');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access if user has ADMIN role and route requires MODERATOR or ADMIN', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(['MODERATOR', 'ADMIN']);
      const context = createMockContext('ADMIN');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if user has no roles or user is not logged in', () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(['MODERATOR', 'ADMIN']);
      const context1 = createMockContext(undefined, false);
      const context2 = createMockContext(undefined, true);
      expect(guard.canActivate(context1)).toBe(false);
      expect(guard.canActivate(context2)).toBe(false);
    });
  });
});
