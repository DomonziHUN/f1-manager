import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuctionController } from './auction.controller';
import { AuctionService } from './auction.service';
import { AuctionScheduler } from './auction.scheduler';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionScheduler, PrismaService],
  exports: [AuctionService],
})
export class AuctionModule {}