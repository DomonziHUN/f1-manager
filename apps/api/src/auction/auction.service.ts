import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlaceBidDto, ActiveAuctionResponseDto, AuctionPilotResponseDto } from './dto/auction.dto';

@Injectable()
export class AuctionService {
  constructor(private prisma: PrismaService) {}

  // Aktív aukció lekérése
  async getActiveAuction(): Promise<ActiveAuctionResponseDto | null> {
    const auction = await this.prisma.auction.findFirst({
      where: { isActive: true },
      include: {
        pilots: {
          include: {
            pilot: true,
            bids: {
              orderBy: { timestamp: 'desc' },
              take: 1,
              include: {
                user: {
                  select: { username: true }
                }
              }
            }
          }
        }
      }
    });

    if (!auction) {
      return null;
    }

    const now = new Date();
    const timeLeft = Math.max(0, Math.floor((auction.endTime.getTime() - now.getTime()) / 1000));

    const pilots: AuctionPilotResponseDto[] = auction.pilots.map(ap => ({
      id: ap.id,
      pilot: {
        id: ap.pilot.id,
        name: ap.pilot.name,
        nationality: ap.pilot.nationality,
        tier: ap.pilot.tier,
        rarity: ap.pilot.rarity,
        pace: ap.pilot.pace,
        tireManagement: ap.pilot.tireManagement,
        overtaking: ap.pilot.overtaking,
        defense: ap.pilot.defense,
        wetSkill: ap.pilot.wetSkill,
        baseSalary: ap.pilot.baseSalary,
      },
      startPrice: ap.startPrice,
      startCoins: ap.startCoins,
      currentBid: ap.bids[0] ? {
        amount: ap.bids[0].amount,
        coins: ap.bids[0].coins,
        bidder: ap.bids[0].user.username,
        timestamp: ap.bids[0].timestamp,
      } : {
        amount: ap.startPrice,
        coins: ap.startCoins,
        bidder: 'Kezdő ár',
        timestamp: new Date(),
      },
      timeLeft: timeLeft,
    }));

    return {
      id: auction.id,
      endTime: auction.endTime,
      pilots: pilots,
      timeLeft: timeLeft,
    };
  }

  // Licitálás
  async placeBid(userId: string, auctionPilotId: string, bidDto: PlaceBidDto): Promise<void> {
    // Ellenőrizzük, hogy van-e aktív aukció
    const auctionPilot = await this.prisma.auctionPilot.findUnique({
      where: { id: auctionPilotId },
      include: {
        auction: true,
        bids: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        }
      }
    });

    if (!auctionPilot || !auctionPilot.auction.isActive) {
      throw new NotFoundException('Aukció nem található vagy nem aktív');
    }

    // Ellenőrizzük, hogy nem járt-e le az aukció
    if (new Date() > auctionPilot.auction.endTime) {
      throw new BadRequestException('Az aukció már lejárt');
    }

    // Ellenőrizzük a user pénzét és coin-jait
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { team: true }
    });

    if (!user || !user.team) {
      throw new BadRequestException('Nincs csapatod');
    }

    if (user.team.budget < bidDto.amount) {
      throw new BadRequestException('Nincs elég pénzed');
    }

    if (user.coins < bidDto.coins) {
      throw new BadRequestException('Nincs elég coin-od');
    }

    // Ellenőrizzük, hogy magasabb-e a licit
    const currentHighestBid = auctionPilot.bids[0];
    
    if (currentHighestBid) {
      const isHigherBid = 
        bidDto.coins > currentHighestBid.coins || 
        (bidDto.coins === currentHighestBid.coins && bidDto.amount > currentHighestBid.amount);
      
      if (!isHigherBid) {
        throw new BadRequestException('A licitnek magasabbnak kell lennie');
      }

      // Ellenőrizzük, hogy nem saját magára licitál-e
      if (currentHighestBid.userId === userId) {
        throw new BadRequestException('Nem licitálhatsz saját magadra');
      }
    } else {
      // Első licit - ellenőrizzük a minimum árat
      if (bidDto.amount < auctionPilot.startPrice || bidDto.coins < auctionPilot.startCoins) {
        throw new BadRequestException('A licit nem éri el a minimum árat');
      }
    }

    // Licit mentése
    await this.prisma.bid.create({
      data: {
        amount: bidDto.amount,
        coins: bidDto.coins,
        userId: userId,
        auctionId: auctionPilot.auction.id,
        auctionPilotId: auctionPilotId,
      }
    });
  }

  // Új aukció létrehozása (cron job fogja hívni)
  async createNewAuction(): Promise<void> {
    // Előző aukció lezárása
    await this.prisma.auction.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Új aukció létrehozása
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 20 * 60 * 1000); // 20 perc

    const auction = await this.prisma.auction.create({
      data: {
        startTime,
        endTime,
        isActive: true,
      }
    });

    // Random 10 pilóta kiválasztása
    const selectedPilots = await this.selectRandomPilots();

    // Pilóták hozzáadása az aukcióhoz
    for (const pilot of selectedPilots) {
      const startPrice = this.calculateStartPrice(pilot.tier, pilot.baseSalary);
      const startCoins = this.calculateStartCoins(pilot.tier);

      await this.prisma.auctionPilot.create({
        data: {
          auctionId: auction.id,
          pilotId: pilot.id,
          startPrice,
          startCoins,
        }
      });
    }

    console.log(`🏁 Új aukció létrehozva: ${selectedPilots.length} pilóta`);
  }

  // Random pilóták kiválasztása tier alapú súlyozással
  private async selectRandomPilots(): Promise<any[]> {
    const tierWeights = {
      1: 0.05, // 5% esély legendary
      2: 0.15, // 15% esély epic
      3: 0.30, // 30% esély rare
      4: 0.35, // 35% esély common
      5: 0.15, // 15% esély rookie
    };

    const selectedPilots: any[] = [];
    const usedPilotIds = new Set<string>(); // ← Duplikátum elkerülése
    
    let attempts = 0;
    while (selectedPilots.length < 10 && attempts < 50) { // ← Max 50 próbálkozás
      attempts++;
      
      // Random tier kiválasztása súlyozás alapján
      const randomTier = this.weightedRandomTier(tierWeights);
      
      // Random pilóta az adott tier-ből
      const pilots = await this.prisma.pilot.findMany({
        where: { 
          tier: randomTier,
          id: { notIn: Array.from(usedPilotIds) } // ← Kizárjuk a már használtakat
        }
      });
      
      if (pilots.length > 0) {
        const randomPilot = pilots[Math.floor(Math.random() * pilots.length)];
        
        if (!usedPilotIds.has(randomPilot.id)) { // ← Dupla ellenőrzés
          selectedPilots.push(randomPilot);
          usedPilotIds.add(randomPilot.id);
        }
      }
    }

    console.log(`🎲 ${selectedPilots.length} egyedi pilóta kiválasztva ${attempts} próbálkozásból`);
    return selectedPilots;
  }

  private weightedRandomTier(weights: Record<number, number>): number {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [tier, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) {
        return parseInt(tier);
      }
    }
    
    return 5; // fallback
  }

  private calculateStartPrice(tier: number, baseSalary: number): number {
    const multipliers = { 1: 0.8, 2: 0.6, 3: 0.4, 4: 0.3, 5: 0.2 };
    return Math.round(baseSalary * (multipliers[tier] || 0.2));
  }

  private calculateStartCoins(tier: number): number {
    const coinCosts = { 1: 50, 2: 20, 3: 8, 4: 3, 5: 1 };
    return coinCosts[tier] || 1;
  }

  // Aukció befejezése és nyertesek kiosztása
  async finalizeAuction(auctionId: string): Promise<void> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        pilots: {
          include: {
            pilot: true,
            bids: {
              orderBy: { timestamp: 'desc' },
              take: 1,
              include: { user: { include: { team: true } } }
            }
          }
        }
      }
    });

    if (!auction) return;

    // Minden pilótánál a legmagasabb licit nyert
    for (const auctionPilot of auction.pilots) {
      const winningBid = auctionPilot.bids[0];
      
      if (winningBid && winningBid.user.team) {
        // Pénz és coin levonása
        await this.prisma.user.update({
          where: { id: winningBid.userId },
          data: {
            coins: { decrement: winningBid.coins }
          }
        });

        await this.prisma.team.update({
          where: { id: winningBid.user.team.id },
          data: {
            budget: { decrement: winningBid.amount }
          }
        });

        // Pilóta hozzáadása a csapathoz
        await this.prisma.ownedPilot.create({
          data: {
            teamId: winningBid.user.team.id,
            pilotId: auctionPilot.pilotId,
          }
        });

        console.log(`🏆 ${winningBid.user.username} megnyerte: ${auctionPilot.pilot.name}`);
      }
    }

    // Aukció lezárása
    await this.prisma.auction.update({
      where: { id: auctionId },
      data: { isActive: false }
    });
  }
}