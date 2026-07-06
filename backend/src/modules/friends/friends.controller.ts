import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FriendsService } from './friends.service';

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('follow/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  async followUser(@Param('id') id: string) {
    const mockUserId = '123';
    return this.friendsService.followUser(mockUserId, id);
  }

  @Delete('follow/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollowUser(@Param('id') id: string) {
    const mockUserId = '123';
    return this.friendsService.unfollowUser(mockUserId, id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get followers of a user' })
  async getFollowers(@Param('id') id: string) {
    return this.friendsService.getFollowers(id);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users followed by a user' })
  async getFollowing(@Param('id') id: string) {
    return this.friendsService.getFollowing(id);
  }
}
