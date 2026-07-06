import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    include: {
      stats: true,
      activities: true,
      languages: true,
      rating: true,
    }
  });

  if (users.length === 0) {
    console.log("No users found in DB.");
    return;
  }

  for (const user of users) {
    console.log(`\nUser: ${user.username}`);
    console.log(`Stats exists: ${!!user.stats}`);
    if (user.stats) {
      console.log(`Total Commits: ${user.stats.totalCommits}`);
      console.log(`Contribution Data length: ${user.stats.contributionData ? (user.stats.contributionData as any[]).length : 0}`);
    }
    console.log(`Activities count: ${user.activities.length}`);
    console.log(`Languages count: ${user.languages.length}`);
    console.log(`Rating exists: ${!!user.rating}`);
    if (user.rating) {
      console.log(`Level: ${user.rating.level}, Tier: ${user.rating.tier}, XP: ${user.rating.xp}`);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
