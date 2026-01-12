import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RaceEngineService, RaceSetup, RaceStats } from './race-engine.service';

@Injectable()
export class RaceService {
  constructor(
    private prisma: PrismaService,
    private raceEngine: RaceEngineService,
  ) {}

  // Gyors verseny létrehozása (1v1 vagy vs AI)
  async createQuickRace(userId: string, opponentTeamId?: string) {
    console.log('🔍 createQuickRace called with userId:', userId);
    
    // User csapatának lekérése
    const userTeam = await this.prisma.team.findFirst({
      where: { userId },
      include: {
        car: true,
        ownedPilots: {
          where: { isActive: true },
          take: 1,
          include: {
            pilot: true,
          },
        },
      },
    });

    console.log('🏎️ Found userTeam:', userTeam);

    if (!userTeam || !userTeam.car || userTeam.ownedPilots.length === 0) {
      throw new BadRequestException('Nincs aktív csapatod, autód vagy pilótád!');
    }

    // Ellenfél meghatározása
    let opponentTeam;
    if (opponentTeamId) {
      // Valós ellenfél
      opponentTeam = await this.prisma.team.findUnique({
        where: { id: opponentTeamId },
        include: {
          car: true,
          ownedPilots: {
            where: { isActive: true },
            take: 1,
            include: {
              pilot: true,
            },
          },
        },
      });
      
      if (!opponentTeam || !opponentTeam.car || opponentTeam.ownedPilots.length === 0) {
        throw new NotFoundException('Ellenfél nem található vagy nincs aktív pilótája!');
      }
    } else {
      // AI ellenfél létrehozása az adatbázisban
      opponentTeam = await this.createAIOpponent();
    }

    console.log('🤖 Opponent team:', opponentTeam.name);

    // Verseny létrehozása
    const race = await this.prisma.race.create({
      data: {
        name: `Quick Race - ${userTeam.name} vs ${opponentTeam.name}`,
        track: this.getRandomTrack(),
        weather: this.getRandomWeather(),
        temperature: 15 + Math.floor(Math.random() * 20), // 15-35°C
        laps: 10,
        isActive: true,
        startTime: new Date(),
      },
    });

    console.log('🏁 Race created:', race.id);

    // Résztvevők hozzáadása
    await this.prisma.raceParticipant.createMany({
      data: [
        {
          raceId: race.id,
          teamId: userTeam.id,
          pilotId: userTeam.ownedPilots[0].pilot.id,
          carId: userTeam.car.id,
        },
        {
          raceId: race.id,
          teamId: opponentTeam.id,
          pilotId: opponentTeam.ownedPilots[0].pilot.id,
          carId: opponentTeam.car.id,
        },
      ],
    });

    console.log('✅ Participants added');

    return { raceId: race.id };
  }

  // Verseny szimulálása
  async simulateRace(raceId: string) {
    const race = await this.prisma.race.findUnique({
      where: { id: raceId },
      include: {
        participants: {
          include: {
            team: true,
            pilot: true,
            car: true,
          },
        },
      },
    });

    if (!race) {
      throw new NotFoundException('Verseny nem található!');
    }

    if (!race.isActive) {
      throw new BadRequestException('Verseny már befejeződött!');
    }

    // Résztvevők adatainak előkészítése
    const participantData = race.participants.map(p => ({
      setup: {
        teamId: p.teamId,
        pilotId: p.pilotId,
        carId: p.carId,
      } as RaceSetup,
      stats: {
        pilot: {
          pace: p.pilot.pace,
          tireManagement: p.pilot.tireManagement,
          overtaking: p.pilot.overtaking,
          defense: p.pilot.defense,
          wetSkill: p.pilot.wetSkill,
        },
        car: {
          engine: p.car.engine,
          aero: p.car.aero,
          chassis: p.car.chassis,
          reliability: p.car.reliability,
        },
      } as RaceStats,
    }));

    // Verseny szimuláció
    const results = this.raceEngine.simulateRace(
      participantData,
      race.weather as any,
      race.laps,
    );

    // Eredmények mentése
    await this.prisma.raceResult.createMany({
      data: results.map(result => ({
        raceId: race.id,
        teamId: result.teamId,
        pilotId: result.pilotId,
        position: result.finalPosition,
        totalTime: result.totalTime === Infinity ? 0 : result.totalTime,
        lapTimes: result.lapTimes,
        dnf: result.dnf,
        dnfReason: result.dnfReason,
      })),
    });

    // Verseny lezárása
    await this.prisma.race.update({
      where: { id: raceId },
      data: {
        isActive: false,
        endTime: new Date(),
      },
    });

    return {
      raceId: race.id,
      results: results.map(r => ({
        teamId: r.teamId,
        pilotId: r.pilotId,
        position: r.finalPosition,
        totalTime: r.totalTime,
        dnf: r.dnf,
        dnfReason: r.dnfReason,
      })),
    };
  }

  // Verseny eredményeinek lekérése
  async getRaceResults(raceId: string) {
    const race = await this.prisma.race.findUnique({
      where: { id: raceId },
      include: {
        results: {
          orderBy: { position: 'asc' },
        },
        participants: {
          include: {
            team: { select: { name: true } },
            pilot: { select: { name: true } },
          },
        },
      },
    });

    if (!race) {
      throw new NotFoundException('Verseny nem található!');
    }

    return {
      race: {
        id: race.id,
        name: race.name,
        track: race.track,
        weather: race.weather,
        laps: race.laps,
        startTime: race.startTime,
        endTime: race.endTime,
      },
      results: race.results.map(result => {
        const participant = race.participants.find(p => 
          p.teamId === result.teamId && p.pilotId === result.pilotId
        );
        
        return {
          position: result.position,
          teamName: participant?.team.name || 'Unknown',
          pilotName: participant?.pilot.name || 'Unknown',
          totalTime: result.totalTime,
          lapTimes: result.lapTimes,
          dnf: result.dnf,
          dnfReason: result.dnfReason,
        };
      }),
    };
  }

  // AI ellenfél létrehozása az adatbázisban
  private async createAIOpponent() {
    console.log('🤖 Creating AI opponent...');
    
    // AI csapat létrehozása
    const aiTeam = await this.prisma.team.create({
      data: {
        name: `AI ${this.getRandomAITeamName()}`,
        budget: 10000000,
        primaryColor: '#FF0000',
        secondaryColor: '#000000',
        userId: 'ai-user-' + Date.now(), // Egyedi AI user ID
      },
    });

    // AI autó létrehozása
    const aiCar = await this.prisma.car.create({
      data: {
        teamId: aiTeam.id,
        engine: 40 + Math.floor(Math.random() * 40), // 40-80
        aero: 40 + Math.floor(Math.random() * 40),
        chassis: 40 + Math.floor(Math.random() * 40),
        reliability: 60 + Math.floor(Math.random() * 30), // 60-90
      },
    });

    // AI pilóta létrehozása
    const aiPilot = await this.prisma.pilot.create({
      data: {
        name: this.getRandomAIPilotName(),
        nationality: 'AI',
        tier: 1,
        rarity: 'common',
        pace: 40 + Math.floor(Math.random() * 40),
        tireManagement: 40 + Math.floor(Math.random() * 40),
        overtaking: 40 + Math.floor(Math.random() * 40),
        defense: 40 + Math.floor(Math.random() * 40),
        wetSkill: 40 + Math.floor(Math.random() * 40),
        baseSalary: 500000,
      },
    });

    // AI pilóta hozzáadása a csapathoz
    const aiOwnedPilot = await this.prisma.ownedPilot.create({
      data: {
        teamId: aiTeam.id,
        pilotId: aiPilot.id,
        isActive: true,
      },
    });

    console.log('✅ AI opponent created:', aiTeam.name);

    return {
      id: aiTeam.id,
      name: aiTeam.name,
      car: aiCar,
      ownedPilots: [{
        pilot: aiPilot,
        isActive: true,
      }],
    };
  }

  private getRandomTrack(): string {
    const tracks = [
      'Monaco', 'Silverstone', 'Spa-Francorchamps', 'Monza', 'Suzuka',
      'Interlagos', 'Nürburgring', 'Circuit de Barcelona', 'Hungaroring'
    ];
    return tracks[Math.floor(Math.random() * tracks.length)];
  }

  private getRandomWeather(): string {
    const weather = ['DRY', 'DRY', 'DRY', 'WET', 'MIXED']; // 60% száraz
    return weather[Math.floor(Math.random() * weather.length)];
  }

  private getRandomAIPilotName(): string {
    const names = [
      'Alex Storm', 'Max Thunder', 'Luna Speed', 'Rio Flash',
      'Nova Drift', 'Zara Boost', 'Kai Turbo', 'Ace Lightning'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomAITeamName(): string {
    const names = [
      'Thunder Racing', 'Lightning Bolts', 'Speed Demons', 'Turbo Racers',
      'Velocity Squad', 'Nitro Team', 'Apex Hunters', 'Circuit Masters'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
}