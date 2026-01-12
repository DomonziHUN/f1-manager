import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { PlaceBidDto, ActiveAuctionResponseDto } from './dto/auction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auction')
@UseGuards(JwtAuthGuard)
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Get('active')
  async getActiveAuction(): Promise<ActiveAuctionResponseDto | null> {
    return this.auctionService.getActiveAuction();
  }

  @Post('bid/:auctionPilotId')
  async placeBid(
    @Request() req: any,
    @Param('auctionPilotId') auctionPilotId: string,
    @Body() bidDto: PlaceBidDto,
  ): Promise<{ message: string }> {
    await this.auctionService.placeBid(req.user.sub, auctionPilotId, bidDto);
    return { message: 'Licit sikeresen leadva' };
  }

  @Post('create')
  async createAuction(): Promise<{ message: string }> {
    // TODO: Ezt csak admin vagy cron job hívhatja majd
    await this.auctionService.createNewAuction();
    return { message: 'Új aukció létrehozva' };
  }
}