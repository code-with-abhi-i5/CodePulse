import { Controller, Delete, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
