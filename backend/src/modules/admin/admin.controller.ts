import { Controller, Delete, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AcmeCertService } from '../security/acme-cert.service';
import type { SslStatusResponse } from '../security/acme-cert.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly acmeCertService: AcmeCertService,
  ) {}

  @Delete('user/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('maintenance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle maintenance mode (Admin only)' })
  async toggleMaintenance(@Body('active') active: boolean) {
    return this.adminService.setMaintenanceMode(active);
  }

  @Get('ssl-status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get SSL/TLS certificate auto-renewal and expiration status',
  })
  getSslStatus(): SslStatusResponse {
    return this.acmeCertService.getCertificateStatus();
  }

  @Post('ssl-renew')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Manually trigger ACME SSL certificate check and renewal',
  })
  async triggerSslRenewal(): Promise<{
    renewed: boolean;
    status: SslStatusResponse;
  }> {
    const renewed = await this.acmeCertService.checkAndRenewCertificate();
    return {
      renewed,
      status: this.acmeCertService.getCertificateStatus(),
    };
  }
}
