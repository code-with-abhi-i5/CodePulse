"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function check() {
    const users = await prisma.user.findMany({ include: { repositories: true } });
    for (const user of users) {
        console.log(`User: ${user.username}, Repos: ${user.repositories?.length || 0}`);
    }
}
check();
//# sourceMappingURL=check_repos.js.map