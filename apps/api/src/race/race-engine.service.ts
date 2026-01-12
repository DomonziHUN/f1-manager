import { Injectable } from '@nestjs/common';

export interface RaceSetup {
  teamId: string;
  pilotId: string;
  carId: string;
}

export interface RaceStats {
  pilot: {
    pace: number;
    tireManagement: number;
    overtaking: number;
    defense: number;
    wetSkill: number;
  };
  car: {
    engine: number;
    aero: number;
    chassis: number;
    reliability: number;
  };
}

export interface LapResult {
  lapNumber: number;
  lapTime: number;
  position: number;
}

export interface RaceResult {
  teamId: string;
  pilotId: string;
  finalPosition: number;
  totalTime: number;
  lapTimes: number[];
  dnf: boolean;
  dnfReason?: string;
}

@Injectable()
export class RaceEngineService {
  
  simulateRace(
    participants: { setup: RaceSetup; stats: RaceStats }[],
    weather: 'DRY' | 'WET' | 'MIXED' = 'DRY',
    laps: number = 10
  ): RaceResult[] {
    
    const results: RaceResult[] = [];
    
    for (const participant of participants) {
      const { setup, stats } = participant;
      const lapTimes: number[] = [];
      let dnf = false;
      let dnfReason: string | undefined;
      
      // Minden körre szimuláció
      for (let lap = 1; lap <= laps; lap++) {
        // Megbízhatóság ellenőrzés
        const reliabilityCheck = Math.random() * 100;
        if (reliabilityCheck > stats.car.reliability) {
          dnf = true;
          dnfReason = this.getRandomFailure();
          break;
        }
        
        // Alap körido számítás
        const lapTime = this.calculateLapTime(stats, weather, lap, laps);
        lapTimes.push(lapTime);
      }
      
      const totalTime = dnf ? Infinity : lapTimes.reduce((sum, time) => sum + time, 0);
      
      results.push({
        teamId: setup.teamId,
        pilotId: setup.pilotId,
        finalPosition: 0, // Később számoljuk
        totalTime,
        lapTimes,
        dnf,
        dnfReason
      });
    }
    
    // Pozíciók kiszámítása
    results.sort((a, b) => {
      if (a.dnf && !b.dnf) return 1;
      if (!a.dnf && b.dnf) return -1;
      return a.totalTime - b.totalTime;
    });
    
    results.forEach((result, index) => {
      result.finalPosition = index + 1;
    });
    
    return results;
  }
  
  private calculateLapTime(
    stats: RaceStats, 
    weather: string, 
    currentLap: number, 
    totalLaps: number
  ): number {
    // Alap körido (60-120 másodperc)
    let baseLapTime = 80 + Math.random() * 20;
    
    // Pilot hatások
    const paceBonus = (stats.pilot.pace - 50) * 0.4;
    const tireBonus = (stats.pilot.tireManagement - 50) * 0.2;
    
    // Car hatások  
    const engineBonus = (stats.car.engine - 50) * 0.3;
    const aeroBonus = (stats.car.aero - 50) * 0.2;
    const chassisBonus = (stats.car.chassis - 50) * 0.1;
    
    // Időjárás hatás
    let weatherMultiplier = 1;
    if (weather === 'WET') {
      const wetSkillBonus = (stats.pilot.wetSkill - 50) * 0.01;
      weatherMultiplier = 1.2 + wetSkillBonus; // Esőben lassabb
    }
    
    // Gumi kopás (későbbi körökben lassabb)
    const tireWear = (currentLap / totalLaps) * 5; // Max +5 sec
    const tireWearReduction = (stats.pilot.tireManagement / 100) * tireWear;
    
    // Random faktor
    const randomFactor = (Math.random() - 0.5) * 4;
    
    const finalTime = (baseLapTime - paceBonus - tireBonus - engineBonus - aeroBonus - chassisBonus + tireWear - tireWearReduction + randomFactor) * weatherMultiplier;
    
    return Math.max(45, finalTime); // Min 45 sec
  }
  
  private getRandomFailure(): string {
    const failures = [
      'ENGINE_FAILURE',
      'GEARBOX_FAILURE', 
      'SUSPENSION_FAILURE',
      'BRAKE_FAILURE',
      'CRASH',
      'PUNCTURE'
    ];
    return failures[Math.floor(Math.random() * failures.length)];
  }
}