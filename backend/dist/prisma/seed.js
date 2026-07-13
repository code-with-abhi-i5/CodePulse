"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting seed...');
    const achievements = [
        {
            id: 'ach_first_blood',
            title: 'First Blood',
            description: 'Make your first commit on the platform',
            category: 'COMMITS',
            rarity: client_1.Rarity.COMMON,
            target: 1,
            xpReward: 50,
            icon: '🔥',
        },
        {
            id: 'ach_centurion',
            title: 'Centurion',
            description: 'Reach 100 total commits',
            category: 'COMMITS',
            rarity: client_1.Rarity.RARE,
            target: 100,
            xpReward: 200,
            icon: '💯',
        },
        {
            id: 'ach_open_sourcer',
            title: 'Open Source Contributor',
            description: 'Merge 10 Pull Requests',
            category: 'PRS',
            rarity: client_1.Rarity.EPIC,
            target: 10,
            xpReward: 500,
            icon: '🌟',
        },
        {
            id: 'ach_legendary_coder',
            title: 'Legendary Coder',
            description: 'Reach 1000 total commits',
            category: 'COMMITS',
            rarity: client_1.Rarity.LEGENDARY,
            target: 1000,
            xpReward: 2000,
            icon: '👑',
        },
    ];
    for (const ach of achievements) {
        await prisma.achievement.upsert({
            where: { id: ach.id },
            update: ach,
            create: ach,
        });
    }
    console.log('Seeded Achievements successfully.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map