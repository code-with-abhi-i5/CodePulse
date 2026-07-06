import { useQuery } from '@tanstack/react-query';
import { apiClient, extractData } from '@/lib/api-client';

export function useActiveChallenges() {
  return useQuery({
    queryKey: ['challenges', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/challenges/active');
      return extractData<any[]>(response);
    },
  });
}

export function useUserChallenges(userId: string) {
  return useQuery({
    queryKey: ['challenges', 'user', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/challenges/user/${userId}`);
      return extractData<any[]>(response);
    },
    enabled: !!userId,
  });
}
