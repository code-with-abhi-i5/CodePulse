import { PrismaService } from '../../prisma/prisma.service';
export declare class SearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchGlobal(query: string): Promise<{
        users: {
            id: string;
            username: string;
            name: string | null;
            avatar: string | null;
        }[];
        repositories: {
            id: string;
            name: string;
            userId: string;
            fullName: string;
            language: string | null;
            stars: number;
        }[];
    }>;
}
