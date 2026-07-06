import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CompareService } from './compare.service';
import { CompareDevelopersDto } from './dto/compare.dto';

@ApiTags('compare')
@Controller('compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Get()
  @ApiOperation({ summary: 'Compare two developers by username' })
  async compare(@Query() query: CompareDevelopersDto) {
    return this.compareService.compareDevelopers(query.username1, query.username2);
  }
}
