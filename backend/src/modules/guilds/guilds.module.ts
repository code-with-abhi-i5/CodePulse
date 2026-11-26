import { Module } from '@nestjs/common';
import { GuildsController } from './guilds.controller';
import { GuildsService } from './guilds.service';
import { TerritoryConquestService } from './territory-conquest.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GuildsController],
  providers: [GuildsService, TerritoryConquestService],
  exports: [GuildsService, TerritoryConquestService],
})
export class GuildsModule {}
