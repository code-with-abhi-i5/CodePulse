import { Controller, Get, Put, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications' })
  async getMyNotifications() {
    const mockUserId = '123';
    return this.notificationsService.getUserNotifications(mockUserId);
  }

  @Put(':id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('read-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  async markAllAsRead() {
    const mockUserId = '123';
    return this.notificationsService.markAllAsRead(mockUserId);
  }
}
