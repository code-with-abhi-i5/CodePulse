import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(query: string): Promise<{
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
