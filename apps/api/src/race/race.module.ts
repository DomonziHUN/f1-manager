import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RaceController } from './race.controller';
import { RaceService } from './race.service';
import { RaceEngineService } from './race-engine.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [RaceController],
  providers: [RaceService, RaceEngineService, PrismaService],
  exports: [RaceService, RaceEngineService],
})
export class RaceModule {}