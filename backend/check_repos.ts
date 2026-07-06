import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const users = await prisma.user.findMany({ include: { repositories: true } });
  for (const user of users) {
    console.log(`User: ${user.username}, Repos: ${user.repositories?.length || 0}`);
  }
}
check();
