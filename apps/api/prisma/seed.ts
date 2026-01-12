import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pilóta alapadatok
const basePilots = [
  { name: 'Max Verstappen', nationality: 'NED' },
  { name: 'Lewis Hamilton', nationality: 'GBR' },
  { name: 'Charles Leclerc', nationality: 'MON' },
  { name: 'Lando Norris', nationality: 'GBR' },
  { name: 'Oscar Piastri', nationality: 'AUS' },
  { name: 'George Russell', nationality: 'GBR' },
  { name: 'Carlos Sainz', nationality: 'ESP' },
  { name: 'Fernando Alonso', nationality: 'ESP' },
  { name: 'Sergio Perez', nationality: 'MEX' },
  { name: 'Valtteri Bottas', nationality: 'FIN' },
  { name: 'Alex Albon', nationality: 'THA' },
  { name: 'Yuki Tsunoda', nationality: 'JPN' },
  { name: 'Logan Sargeant', nationality: 'USA' },
  { name: 'Nico Hulkenberg', nationality: 'GER' },
  { name: 'Oliver Bearman', nationality: 'GBR' },
  { name: 'Liam Lawson', nationality: 'NZL' },
];

// Tier konfigurációk
const tierConfigs = {
  1: { rarity: 'legendary', statMultiplier: 1.0, salaryMultiplier: 3.0 },
  2: { rarity: 'epic', statMultiplier: 0.85, salaryMultiplier: 2.0 },
  3: { rarity: 'rare', statMultiplier: 0.7, salaryMultiplier: 1.2 },
  4: { rarity: 'common', statMultiplier: 0.55, salaryMultiplier: 0.7 },
  5: { rarity: 'common', statMultiplier: 0.4, salaryMultiplier: 0.3 },
};

// Pilóta base statisztikák (tier 1-es értékek)
const pilotBaseStats = {
  'Max Verstappen': { pace: 98, tire: 92, overtaking: 95, defense: 94, wet: 96, baseSalary: 15000000 },
  'Lewis Hamilton': { pace: 95, tire: 98, overtaking: 96, defense: 92, wet: 98, baseSalary: 14000000 },
  'Charles Leclerc': { pace: 94, tire: 88, overtaking: 92, defense: 89, wet: 91, baseSalary: 12000000 },
  'Lando Norris': { pace: 88, tire: 92, overtaking: 85, defense: 87, wet: 90, baseSalary: 8500000 },
  'Oscar Piastri': { pace: 82, tire: 78, overtaking: 80, defense: 83, wet: 75, baseSalary: 3200000 },
  'George Russell': { pace: 86, tire: 89, overtaking: 84, defense: 88, wet: 87, baseSalary: 7000000 },
  'Carlos Sainz': { pace: 87, tire: 91, overtaking: 88, defense: 90, wet: 89, baseSalary: 9000000 },
  'Fernando Alonso': { pace: 91, tire: 96, overtaking: 94, defense: 95, wet: 94, baseSalary: 10000000 },
  'Sergio Perez': { pace: 84, tire: 87, overtaking: 81, defense: 86, wet: 83, baseSalary: 6500000 },
  'Valtteri Bottas': { pace: 83, tire: 85, overtaking: 79, defense: 82, wet: 84, baseSalary: 5000000 },
  'Alex Albon': { pace: 79, tire: 82, overtaking: 77, defense: 85, wet: 80, baseSalary: 2500000 },
  'Yuki Tsunoda': { pace: 76, tire: 74, overtaking: 78, defense: 72, wet: 76, baseSalary: 1800000 },
  'Logan Sargeant': { pace: 71, tire: 69, overtaking: 68, defense: 70, wet: 67, baseSalary: 1200000 },
  'Nico Hulkenberg': { pace: 80, tire: 88, overtaking: 82, defense: 87, wet: 85, baseSalary: 3000000 },
  'Oliver Bearman': { pace: 68, tire: 65, overtaking: 70, defense: 67, wet: 64, baseSalary: 800000 },
  'Liam Lawson': { pace: 72, tire: 70, overtaking: 74, defense: 69, wet: 71, baseSalary: 1000000 },
};

async function main() {
  console.log('🏎️ Pilóták tier rendszerrel feltöltése...');
  
  // Minden pilótához minden tier
  for (const pilot of basePilots) {
    const baseStats = pilotBaseStats[pilot.name];
    if (!baseStats) continue;
    
    for (let tier = 1; tier <= 5; tier++) {
      const config = tierConfigs[tier];
      
      await prisma.pilot.create({
        data: {
          name: pilot.name,
          nationality: pilot.nationality,
          tier: tier,
          rarity: config.rarity,
          pace: Math.round(baseStats.pace * config.statMultiplier),
          tireManagement: Math.round(baseStats.tire * config.statMultiplier),
          overtaking: Math.round(baseStats.overtaking * config.statMultiplier),
          defense: Math.round(baseStats.defense * config.statMultiplier),
          wetSkill: Math.round(baseStats.wet * config.statMultiplier),
          baseSalary: Math.round(baseStats.baseSalary * config.salaryMultiplier),
        },
      });
    }
  }
  
  console.log('✅ Pilóták sikeresen feltöltve tier rendszerrel!');
  console.log('📊 Összesen:', basePilots.length * 5, 'pilóta verzió');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });