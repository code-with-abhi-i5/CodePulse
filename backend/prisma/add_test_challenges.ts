import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 1);

  await prisma.challenge.createMany({
    data: [
      {
        title: 'Daily Committer',
        description: 'Make 3 commits today',
        type: 'DAILY',
        difficulty: 'EASY',
        xpReward: 50,
        target: 3,
        category: 'COMMITS',
        icon: 'Flame',
        expiresAt
      },
      {
        title: 'Bug Squasher',
        description: 'Close 1 issue today',
        type: 'DAILY',
        difficulty: 'MEDIUM',
        xpReward: 70,
        target: 1,
        category: 'ISSUES',
        icon: 'Target',
        expiresAt
      }
    ]
  });
  console.log("Added test challenges!");
}

main().finally(() => prisma.$disconnect());
