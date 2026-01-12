/*
  Warnings:

  - You are about to drop the column `salary` on the `Pilot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pilot" DROP COLUMN "salary",
ADD COLUMN     "baseSalary" INTEGER NOT NULL DEFAULT 500000,
ADD COLUMN     "nationality" TEXT NOT NULL DEFAULT 'UNK',
ADD COLUMN     "rarity" TEXT NOT NULL DEFAULT 'common',
ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "OwnedPilot" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,

    CONSTRAINT "OwnedPilot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionPilot" (
    "id" TEXT NOT NULL,
    "startPrice" INTEGER NOT NULL DEFAULT 1000000,
    "startCoins" INTEGER NOT NULL DEFAULT 1,
    "auctionId" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,

    CONSTRAINT "AuctionPilot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "auctionPilotId" TEXT NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnedPilot_teamId_pilotId_key" ON "OwnedPilot"("teamId", "pilotId");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionPilot_auctionId_pilotId_key" ON "AuctionPilot"("auctionId", "pilotId");

-- AddForeignKey
ALTER TABLE "OwnedPilot" ADD CONSTRAINT "OwnedPilot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedPilot" ADD CONSTRAINT "OwnedPilot_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionPilot" ADD CONSTRAINT "AuctionPilot_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionPilot" ADD CONSTRAINT "AuctionPilot_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionPilotId_fkey" FOREIGN KEY ("auctionPilotId") REFERENCES "AuctionPilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
