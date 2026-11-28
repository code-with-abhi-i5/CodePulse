import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportJobDto } from './dto/report-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportFormat } from '@prisma/client';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('system')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get overall system report and metrics (Admin or authenticated user)' })
  async getSystemReport() {
    return this.reportsService.getSystemReport();
  }

  @Post('jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Submit an asynchronous executive performance report compilation job',
  })
  @ApiResponse({
    status: 202,
    description: 'Report job accepted and queued for compilation',
  })
  async createReportJob(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateReportJobDto,
  ) {
    return this.reportsService.createReportJob(req.user.id, dto);
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Poll status and metadata of a report compilation job' })
  @ApiParam({ name: 'id', description: 'UUID of the report job' })
  async getReportJob(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.reportsService.getReportJob(req.user.id, id);
  }

  @Get('download/:token')
  @ApiOperation({
    summary:
      'Stream and download compiled executive report using an ephemeral 24-hour token',
  })
  @ApiParam({ name: 'token', description: 'Secure 24-hour download token' })
  async downloadReport(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const artifact = await this.reportsService.downloadReport(token);

    const contentTypes: Record<ReportFormat, string> = {
      [ReportFormat.JSON]: 'application/json; charset=utf-8',
      [ReportFormat.CSV]: 'text/csv; charset=utf-8',
      [ReportFormat.PDF]: 'application/pdf',
    };

    const contentType = contentTypes[artifact.format] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${artifact.fileName}"`,
    );
    res.setHeader('X-CodePulse-Report-Checksum', artifact.checksum);
    res.setHeader('X-CodePulse-Report-Format', artifact.format);
    res.setHeader('Transfer-Encoding', 'chunked');

    artifact.stream.pipe(res);
  }
}
