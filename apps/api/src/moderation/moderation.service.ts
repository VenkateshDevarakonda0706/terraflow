import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, ReportStatus } from '@terraflow/database';

@Injectable()
export class ModerationService {
  async getReports() {
    return prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          },
        },
        post: {
          include: {
            media: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePic: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateReportStatus(reportId: string, status: ReportStatus) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: { status },
      });

      if (status === 'RESOLVED' && report.postId) {
        await tx.post.update({
          where: { id: report.postId },
          data: { isModerated: true },
        });
      }

      return updatedReport;
    });
  }
}
