import { useQuery } from '@tanstack/react-query';
import { apiClient, extractData } from '@/lib/api-client';

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['users', 'profile', username],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${username}`);
      return extractData(response);
    },
    enabled: !!username,
  });
}
