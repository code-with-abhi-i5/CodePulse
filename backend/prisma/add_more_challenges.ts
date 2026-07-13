import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  const expiresAtEndOfWeek = new Date(now);
  expiresAtEndOfWeek.setDate(expiresAtEndOfWeek.getDate() + 7);
  
  const expiresAtEndOfMonth = new Date(now);
  expiresAtEndOfMonth.setMonth(expiresAtEndOfMonth.getMonth() + 1);

  const expiresAtEndOfSeason = new Date(now);
  expiresAtEndOfSeason.setMonth(expiresAtEndOfSeason.getMonth() + 3);

  const templates = [
    {
      title: 'Weekly Warrior',
      description: 'Make 15 commits this week',
      type: 'WEEKLY' as any,
      difficulty: 'MEDIUM' as any,
      xpReward: 200,
      target: 15,
      category: 'COMMITS',
      icon: 'Calendar',
      expiresAt: expiresAtEndOfWeek
    },
    {
      title: 'Monthly Master',
      description: 'Earn 1000 stars this month',
      type: 'MONTHLY' as any,
      difficulty: 'HARD' as any,
      xpReward: 1000,
      target: 1000,
      category: 'STARS',
      icon: 'Trophy',
      expiresAt: expiresAtEndOfMonth
    },
    {
      title: 'Winter Coder',
      description: 'Contribute for 30 days during winter season',
      type: 'SEASONAL' as any,
      difficulty: 'LEGENDARY' as any,
      xpReward: 5000,
      target: 30,
      category: 'STREAK',
      icon: 'Sparkles',
      expiresAt: expiresAtEndOfSeason
    }
  ];

  for (const template of templates) {
    await prisma.challenge.create({
      data: template
    });
  }
  
  console.log("Added test challenges for all categories!");
}

main().finally(() => prisma.$disconnect());
