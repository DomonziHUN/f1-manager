import { IsString, IsNotEmpty, MaxLength, IsHexColor, IsArray, ArrayMaxSize, ArrayUnique } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsString()
  @IsHexColor()
  primaryColor: string;

  @IsString()
  @IsHexColor()
  secondaryColor: string;
}

export class SetActiveDriversDto {
  @IsArray()
  @ArrayMaxSize(2)
  @ArrayUnique()
  ownedPilotIds: string[]; // max 2 db OwnedPilot ID
}

export class TeamResponseDto {
  id: string;
  name: string;
  budget: number;
  primaryColor: string;
  secondaryColor: string;
  createdAt: Date;
  car?: {
    id: string;
    engine: number;
    aero: number;
    chassis: number;
    reliability: number;
  } | null;
  ownedPilots?: Array<{
    id: string;         // OwnedPilot ID
    isActive: boolean;
    acquiredAt: Date;
    pilot: {
      id: string;
      name: string;
      nationality: string;
      tier: number;
      rarity: string;
      pace: number;
      tireManagement: number;
      overtaking: number;
      defense: number;
      wetSkill: number;
      baseSalary: number;
    };
  }>;
}