import { Controller, Get, Patch, Param, Body, UseGuards, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ModerationService } from './moderation.service.js';
import { ReportStatus } from '@terraflow/database';

@Controller('api/v1/moderation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ModerationController {
  declare private moderationService: ModerationService;

  constructor(@Inject(ModerationService) moderationService: ModerationService) {
    this.moderationService = moderationService;
  }

  @Get('reports')
  @Roles('ADMIN', 'MODERATOR')
  async getReports() {
    return this.moderationService.getReports();
  }

  @Patch('reports/:id')
  @Roles('ADMIN', 'MODERATOR')
  async updateReport(
    @Param('id') id: string,
    @Body('status') status: ReportStatus,
  ) {
    return this.moderationService.updateReportStatus(id, status);
  }
}
