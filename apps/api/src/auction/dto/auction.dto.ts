import { IsInt, IsPositive, Min } from 'class-validator';

export class PlaceBidDto {
  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  @Min(0)
  coins: number;
}

export class AuctionPilotResponseDto {
  id: string;
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
  startPrice: number;
  startCoins: number;
  currentBid?: {
    amount: number;
    coins: number;
    bidder: string;
    timestamp: Date;
  };
  timeLeft: number; // másodpercben
}

export class ActiveAuctionResponseDto {
  id: string;
  endTime: Date;
  pilots: AuctionPilotResponseDto[];
  timeLeft: number;
}