-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "weather" TEXT NOT NULL DEFAULT 'DRY',
    "temperature" INTEGER NOT NULL DEFAULT 20,
    "laps" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceParticipant" (
    "id" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,

    CONSTRAINT "RaceParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceResult" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "totalTime" DOUBLE PRECISION NOT NULL,
    "lapTimes" DOUBLE PRECISION[],
    "dnf" BOOLEAN NOT NULL DEFAULT false,
    "dnfReason" TEXT,
    "raceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RaceParticipant_raceId_teamId_key" ON "RaceParticipant"("raceId", "teamId");

-- AddForeignKey
ALTER TABLE "RaceParticipant" ADD CONSTRAINT "RaceParticipant_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceParticipant" ADD CONSTRAINT "RaceParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceParticipant" ADD CONSTRAINT "RaceParticipant_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceParticipant" ADD CONSTRAINT "RaceParticipant_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
