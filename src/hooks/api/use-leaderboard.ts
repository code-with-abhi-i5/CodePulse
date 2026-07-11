import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient, extractData } from '@/lib/api-client';

export function useLeaderboardInfinite(category: 'global' | 'india' | 'friends', limit = 20) {
  return useInfiniteQuery({
    queryKey: ['leaderboards', category, limit],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const cursorParams = pageParam ? `&cursor=${pageParam}` : '';
      const response = await apiClient.get(`/leaderboards/${category}?limit=${limit}${cursorParams}`);
      const result = extractData<{ data: any[], nextCursor: string | null }>(response);
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useUserProfileSearch(username: string) {
  return useQuery({
    queryKey: ['leaderboard', 'user', username],
    queryFn: async () => {
      const response = await apiClient.get(`/leaderboards/user/${username}`);
      return extractData<any>(response);
    },
    enabled: !!username,
  });
}
