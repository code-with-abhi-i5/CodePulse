import { BattlesService } from './battles.service';
import { CreateBattleDto, UpdateBattleStatusDto } from './dto/battles.dto';
export declare class BattlesController {
    private readonly battlesService;
    constructor(battlesService: BattlesService);
    getActiveBattles(): Promise<({
        challenger: {
            id: string;
            username: string;
            avatar: string | null;
        };
        opponent: {
            id: string;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        category: string;
        challengerId: string;
        opponentId: string;
        endsAt: Date;
        status: import("@prisma/client").$Enums.BattleStatus;
        winnerId: string | null;
        challengerScore: number | null;
        opponentScore: number | null;
        startedAt: Date;
    })[]>;
    getUserBattles(userId: string): Promise<({
        challenger: {
            id: string;
            username: string;
            avatar: string | null;
        };
        opponent: {
            id: string;
            username: string;
            avatar: string | null;
        };
        winner: {
            id: string;
            username: string;
        } | null;
    } & {
        id: string;
        category: string;
        challengerId: string;
        opponentId: string;
        endsAt: Date;
        status: import("@prisma/client").$Enums.BattleStatus;
        winnerId: string | null;
        challengerScore: number | null;
        opponentScore: number | null;
        startedAt: Date;
    })[]>;
    createBattle(dto: CreateBattleDto): Promise<{
        id: string;
        category: string;
        challengerId: string;
        opponentId: string;
        endsAt: Date;
        status: import("@prisma/client").$Enums.BattleStatus;
        winnerId: string | null;
        challengerScore: number | null;
        opponentScore: number | null;
        startedAt: Date;
    }>;
    updateBattleStatus(id: string, dto: UpdateBattleStatusDto): Promise<{
        id: string;
        category: string;
        challengerId: string;
        opponentId: string;
        endsAt: Date;
        status: import("@prisma/client").$Enums.BattleStatus;
        winnerId: string | null;
        challengerScore: number | null;
        opponentScore: number | null;
        startedAt: Date;
    }>;
}
