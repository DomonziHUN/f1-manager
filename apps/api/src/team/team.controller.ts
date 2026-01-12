import { Controller, Post, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto, TeamResponseDto, SetActiveDriversDto } from './dto/team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  async createTeam(
    @Request() req: any,
    @Body() createTeamDto: CreateTeamDto,
  ): Promise<TeamResponseDto> {
    return this.teamService.createTeam(req.user.sub, createTeamDto);
  }

  @Get()
  async getUserTeam(@Request() req: any): Promise<TeamResponseDto | null> {
    return this.teamService.getUserTeam(req.user.sub);
  }

  @Get('check')
  async hasTeam(@Request() req: any): Promise<{ hasTeam: boolean }> {
    const hasTeam = await this.teamService.hasTeam(req.user.sub);
    return { hasTeam };
  }

  @Put('active-drivers')
  async setActiveDrivers(
    @Request() req: any,
    @Body() body: SetActiveDriversDto,
  ): Promise<TeamResponseDto> {
    return this.teamService.setActiveDrivers(req.user.sub, body);
  }
}