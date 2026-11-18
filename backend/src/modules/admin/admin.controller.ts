import {
  Controller,
  Delete,
  Post,
  Put,
  Get,
  Param,
  Body,
  Query,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  DynamicConfigService,
  DynamicConfigKey,
} from '../../config/dynamic-config.service';
import { AcmeCertService } from '../security/acme-cert.service';
import type { SslStatusResponse } from '../security/acme-cert.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    @Optional() private readonly acmeCertService?: AcmeCertService,
    @Optional() private readonly dynamicConfigService?: DynamicConfigService,
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

  async setMaintenanceMode(active: boolean) {
    return this.adminService.setMaintenanceMode(active);
  }

  // --- Dynamic Configuration Endpoints ---

  @Get('config')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all dynamic configuration parameters' })
  getAllConfig() {
    if (!this.dynamicConfigService) {
      throw new BadRequestException('DynamicConfigService is not available');
    }
    return this.dynamicConfigService.getAll();
  }

  @Get('config/audit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit logs for dynamic configuration changes' })
  getConfigAuditLogs(@Query('limit') limit?: string) {
    if (!this.dynamicConfigService) {
      throw new BadRequestException('DynamicConfigService is not available');
    }
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.dynamicConfigService.getAuditLogs(parsedLimit);
  }

  @Get('config/:key')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific dynamic configuration parameter' })
  @ApiParam({ name: 'key', description: 'Configuration key name' })
  getConfigKey(@Param('key') key: string) {
    if (!this.dynamicConfigService) {
      throw new BadRequestException('DynamicConfigService is not available');
    }
    return {
      key,
      value: this.dynamicConfigService.get(key as DynamicConfigKey),
    };
  }

  @Put('config/:key')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update dynamic configuration parameter with Zod schema validation and hot-reload',
  })
  @ApiParam({ name: 'key', description: 'Configuration key name to update' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        value: {
          description:
            'New configuration value (boolean, number, string, object)',
        },
        updatedBy: {
          type: 'string',
          description: 'Identity of the admin performing the update',
          default: 'admin',
        },
      },
      required: ['value'],
    },
  })
  async updateConfig(
    @Param('key') key: string,
    @Body('value') value: unknown,
    @Body('updatedBy') updatedBy?: string,
  ) {
    if (!this.dynamicConfigService) {
      throw new BadRequestException('DynamicConfigService is not available');
    }
    return this.dynamicConfigService.set(key, value, updatedBy ?? 'admin');
  }

  // --- SSL/TLS Certificate Endpoints ---

  @Get('ssl-status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get SSL/TLS certificate auto-renewal and expiration status',
  })
  getSslStatus(): SslStatusResponse {
    if (!this.acmeCertService) {
      throw new BadRequestException('AcmeCertService is not available');
    }
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
    if (!this.acmeCertService) {
      throw new BadRequestException('AcmeCertService is not available');
    }
    const renewed = await this.acmeCertService.checkAndRenewCertificate();
    return {
      renewed,
      status: this.acmeCertService.getCertificateStatus(),
    };
  }
}
