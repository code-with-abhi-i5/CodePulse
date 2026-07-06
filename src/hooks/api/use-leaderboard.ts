import { useQuery } from '@tanstack/react-query';
import { apiClient, extractData } from '@/lib/api-client';

export function useGlobalLeaderboard(limit = 100) {
  return useQuery({
    queryKey: ['leaderboards', 'global', limit],
    queryFn: async () => {
      const response = await apiClient.get(`/leaderboards/global?limit=${limit}`);
      return extractData<any[]>(response);
    },
  });
}

export function useLanguageLeaderboard(language: string, limit = 50) {
  return useQuery({
    queryKey: ['leaderboards', 'language', language, limit],
    queryFn: async () => {
      const response = await apiClient.get(`/leaderboards/language?language=${language}&limit=${limit}`);
      return extractData<any[]>(response);
    },
    enabled: !!language,
  });
}
