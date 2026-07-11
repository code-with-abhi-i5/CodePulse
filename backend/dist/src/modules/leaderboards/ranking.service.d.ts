export declare class RankingService {
    calculateScore(stats: {
        totalStars: number;
        followers: number;
        publicRepos: number;
        totalForks: number;
    }): number;
}
