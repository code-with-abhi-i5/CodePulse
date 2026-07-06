import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user settings' })
  async getSettings() {
    const mockUserId = '123';
    return this.settingsService.getUserSettings(mockUserId);
  }

  @Put()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user settings' })
  async updateSettings(@Body() settings: any) {
    const mockUserId = '123';
    return this.settingsService.updateUserSettings(mockUserId, settings);
  }
}
