import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, TeamResponseDto, SetActiveDriversDto } from './dto/team.dto';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async createTeam(userId: string, createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
    const existingTeam = await this.prisma.team.findUnique({
      where: { userId },
    });
    if (existingTeam) {
      throw new ConflictException('Már van csapatod');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Csapat létrehozása
      const team = await tx.team.create({
        data: {
          name: createTeamDto.name,
          budget: 10000000,
          primaryColor: createTeamDto.primaryColor,
          secondaryColor: createTeamDto.secondaryColor,
          userId,
        },
      });

      // Autó létrehozása
      const car = await tx.car.create({
        data: {
          engine: 50,
          aero: 50,
          chassis: 50,
          reliability: 50,
          teamId: team.id,
        },
      });

      // 2 alapértelmezett pilóta létrehozása
      const pilot1 = await tx.pilot.create({
        data: {
          name: `${createTeamDto.name} Driver #1`,
          nationality: 'UNK',
          tier: 1,
          rarity: 'common',
          pace: 45 + Math.floor(Math.random() * 20), // 45-65
          tireManagement: 45 + Math.floor(Math.random() * 20),
          overtaking: 45 + Math.floor(Math.random() * 20),
          defense: 45 + Math.floor(Math.random() * 20),
          wetSkill: 45 + Math.floor(Math.random() * 20),
          baseSalary: 500000,
        },
      });

      const pilot2 = await tx.pilot.create({
        data: {
          name: `${createTeamDto.name} Driver #2`,
          nationality: 'UNK',
          tier: 1,
          rarity: 'common',
          pace: 45 + Math.floor(Math.random() * 20), // 45-65
          tireManagement: 45 + Math.floor(Math.random() * 20),
          overtaking: 45 + Math.floor(Math.random() * 20),
          defense: 45 + Math.floor(Math.random() * 20),
          wetSkill: 45 + Math.floor(Math.random() * 20),
          baseSalary: 500000,
        },
      });

      // Pilóták hozzáadása a csapathoz
      const ownedPilot1 = await tx.ownedPilot.create({
        data: {
          teamId: team.id,
          pilotId: pilot1.id,
          isActive: true, // Első pilóta aktív
        },
      });

      const ownedPilot2 = await tx.ownedPilot.create({
        data: {
          teamId: team.id,
          pilotId: pilot2.id,
          isActive: false, // Második pilóta tartalék
        },
      });

      return { 
        team, 
        car, 
        pilots: [pilot1, pilot2],
        ownedPilots: [ownedPilot1, ownedPilot2]
      };
    });

    // Teljes csapat adatok visszaadása (pilótákkal együtt)
    return {
      id: result.team.id,
      name: result.team.name,
      budget: result.team.budget,
      primaryColor: result.team.primaryColor,
      secondaryColor: result.team.secondaryColor,
      createdAt: result.team.createdAt,
      car: {
        id: result.car.id,
        engine: result.car.engine,
        aero: result.car.aero,
        chassis: result.car.chassis,
        reliability: result.car.reliability,
      },
      ownedPilots: result.ownedPilots.map((op, index) => ({
        id: op.id,
        isActive: op.isActive,
        acquiredAt: op.acquiredAt,
        pilot: {
          id: result.pilots[index].id,
          name: result.pilots[index].name,
          nationality: result.pilots[index].nationality,
          tier: result.pilots[index].tier,
          rarity: result.pilots[index].rarity,
          pace: result.pilots[index].pace,
          tireManagement: result.pilots[index].tireManagement,
          overtaking: result.pilots[index].overtaking,
          defense: result.pilots[index].defense,
          wetSkill: result.pilots[index].wetSkill,
          baseSalary: result.pilots[index].baseSalary,
        },
      })),
    };
  }

  async getUserTeam(userId: string): Promise<TeamResponseDto | null> {
    const team = await this.prisma.team.findUnique({
      where: { userId },
      include: {
        car: true,
        ownedPilots: {
          include: { pilot: true },
          orderBy: { acquiredAt: 'desc' },
        },
      },
    });

    if (!team) return null;

    return {
      id: team.id,
      name: team.name,
      budget: team.budget,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
      createdAt: team.createdAt,
      car: team.car
        ? {
            id: team.car.id,
            engine: team.car.engine,
            aero: team.car.aero,
            chassis: team.car.chassis,
            reliability: team.car.reliability,
          }
        : null,
      ownedPilots: team.ownedPilots.map((op) => ({
        id: op.id,
        isActive: op.isActive,
        acquiredAt: op.acquiredAt,
        pilot: {
          id: op.pilot.id,
          name: op.pilot.name,
          nationality: op.pilot.nationality,
          tier: op.pilot.tier,
          rarity: op.pilot.rarity,
          pace: op.pilot.pace,
          tireManagement: op.pilot.tireManagement,
          overtaking: op.pilot.overtaking,
          defense: op.pilot.defense,
          wetSkill: op.pilot.wetSkill,
          baseSalary: op.pilot.baseSalary,
        },
      })),
    };
  }

  async hasTeam(userId: string): Promise<boolean> {
    const team = await this.prisma.team.findUnique({
      where: { userId },
      select: { id: true },
    });
    return !!team;
  }

  // Aktív pilóták beállítása (max 2)
  async setActiveDrivers(userId: string, dto: SetActiveDriversDto): Promise<TeamResponseDto> {
    const team = await this.prisma.team.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!team) {
      throw new NotFoundException('Nincs csapatod');
    }

    const selectedIds = dto.ownedPilotIds ?? [];
    if (selectedIds.length > 2) {
      throw new BadRequestException('Legfeljebb 2 pilótát választhatsz ki');
    }

    // Ellenőrzés: a megadott OwnedPilot-ok ehhez a csapathoz tartoznak-e
    const count = await this.prisma.ownedPilot.count({
      where: {
        id: { in: selectedIds },
        teamId: team.id,
      },
    });
    if (count !== selectedIds.length) {
      throw new BadRequestException('Érvénytelen pilóta kiválasztás');
    }

    await this.prisma.$transaction(async (tx) => {
      // minden inaktiválása
      await tx.ownedPilot.updateMany({
        where: { teamId: team.id },
        data: { isActive: false },
      });

      // kiválasztottak aktiválása
      if (selectedIds.length > 0) {
        await tx.ownedPilot.updateMany({
          where: { id: { in: selectedIds }, teamId: team.id },
          data: { isActive: true },
        });
      }
    });

    // Friss állapot visszaadása – itt biztosítjuk, hogy ne legyen null
    const updated = await this.getUserTeam(userId);
    if (!updated) {
      throw new NotFoundException('Csapat nem található frissítés után');
    }
    return updated;
  }
}