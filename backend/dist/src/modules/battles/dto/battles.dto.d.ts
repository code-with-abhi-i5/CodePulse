import { BattleStatus } from '@prisma/client';
export declare class CreateBattleDto {
    challengerId: string;
    opponentId: string;
    category: string;
    endsAt: string;
}
export declare class UpdateBattleStatusDto {
    status: BattleStatus;
    winnerId?: string;
}
