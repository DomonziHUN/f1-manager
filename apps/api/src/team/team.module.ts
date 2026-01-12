import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [TeamController],
  providers: [TeamService, PrismaService],
  exports: [TeamService],
})
export class TeamModule {}