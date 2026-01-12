import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { RaceService } from './race.service';

@Controller('races')
@UseGuards(JwtAuthGuard)
export class RaceController {
  constructor(private raceService: RaceService) {}

  // Gyors verseny indítása
  @Post('quick')
  async createQuickRace(
    @GetUser() user: any,
    @Body() body: { opponentTeamId?: string }
  ) {
    console.log('Quick race user:', user); // Debug log
    const userId = user.sub || user.id;
    return this.raceService.createQuickRace(userId, body.opponentTeamId);
  }

  // Verseny szimulálása
  @Post(':raceId/simulate')
  async simulateRace(@Param('raceId') raceId: string) {
    return this.raceService.simulateRace(raceId);
  }

  // Verseny eredményeinek lekérése
  @Get(':raceId/results')
  async getRaceResults(@Param('raceId') raceId: string) {
    return this.raceService.getRaceResults(raceId);
  }

  // Debug endpoint - user objektum ellenőrzése
  @Get('debug-user')
  async debugUser(@GetUser() user: any) {
    return { 
      user,
      userId: user.sub || user.id,
      allFields: Object.keys(user)
    };
  }

  // Gyors teszt endpoint (AI ellen)
  @Post('test')
  async quickTest(@GetUser() user: any) {
    console.log('Test race user object:', user); // Debug log
    
    // User ID meghatározása (JWT-ben általában 'sub' mezőben van)
    const userId = user.sub || user.id;
    console.log('Using userId:', userId); // Debug log
    
    try {
      // Verseny létrehozása
      const { raceId } = await this.raceService.createQuickRace(userId);
      
      // Azonnali szimuláció
      const results = await this.raceService.simulateRace(raceId);
      
      // Eredmények lekérése
      const detailedResults = await this.raceService.getRaceResults(raceId);
      
      return {
        message: 'Gyors teszt verseny befejezve!',
        raceId,
        results: detailedResults,
      };
    } catch (error) {
      console.error('Race test error:', error);
      throw error;
    }
  }
}