import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuctionService } from './auction.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuctionScheduler {
  private readonly logger = new Logger(AuctionScheduler.name);

  constructor(
    private auctionService: AuctionService,
    private prisma: PrismaService,
  ) {
    // Induláskor ellenőrizzük, van-e aktív aukció
    this.checkAndCreateAuction();
  }

  // Minden percben ellenőrizzük
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionCron() {
    this.logger.log('⏰ Aukció ellenőrzés...');
    await this.checkAndCreateAuction();
  }

  private async checkAndCreateAuction() {
    try {
      // Aktív aukció keresése
      const activeAuction = await this.prisma.auction.findFirst({
        where: { isActive: true },
      });

      if (!activeAuction) {
        // Nincs aktív aukció - új létrehozása
        this.logger.log('🆕 Nincs aktív aukció, új létrehozása...');
        await this.auctionService.createNewAuction();
        return;
      }

      // Van aktív aukció - ellenőrizzük, lejárt-e
      const now = new Date();
      if (now > activeAuction.endTime) {
        this.logger.log('⏱️ Aukció lejárt, lezárás és nyertesek kiosztása...');
        
        // Nyertesek kiosztása
        await this.auctionService.finalizeAuction(activeAuction.id);
        
        // Új aukció létrehozása
        this.logger.log('🆕 Új aukció létrehozása...');
        await this.auctionService.createNewAuction();
      } else {
        const timeLeft = Math.floor((activeAuction.endTime.getTime() - now.getTime()) / 1000);
        this.logger.log(`✅ Aktív aukció fut még ${timeLeft} másodpercig`);
      }
    } catch (error) {
      this.logger.error('❌ Hiba az aukció kezelésekor:', error);
    }
  }
}