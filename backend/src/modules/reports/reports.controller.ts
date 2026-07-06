import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('system')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get overall system report and metrics (Admin only)' })
  async getSystemReport() {
    return this.reportsService.getSystemReport();
  }
}
