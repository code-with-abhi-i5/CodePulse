import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractData } from '@/lib/api-client';
import { toast } from 'sonner';

export function useActiveBattles() {
  return useQuery({
    queryKey: ['battles', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/battles');
      return extractData<any[]>(response);
    },
  });
}

export function useChallengeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opponentId: string) => {
      const response = await apiClient.post('/battles/challenge', {
        opponentId,
        category: 'global',
      });
      return extractData(response);
    },
    onSuccess: () => {
      toast.success('Challenge sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['battles'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send challenge');
    },
  });
}
