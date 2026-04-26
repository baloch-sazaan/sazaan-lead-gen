import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useCampaigns() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
