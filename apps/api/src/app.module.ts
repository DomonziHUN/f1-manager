import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { TeamModule } from './team/team.module';
import { AuctionModule } from './auction/auction.module';
import { PrismaService } from './prisma/prisma.service';
// Ha használod az AppController-t, akkor importáld és tedd be a controllers tömbbe

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    TeamModule,
    AuctionModule,
  ],
  controllers: [], // ha megtartod az AppController-t: [AppController]
  providers: [PrismaService],
})
export class AppModule {}