'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useLeadFilters } from './use-filters';

export function useLeads() {
  const [filters] = useLeadFilters();
  const supabase = createClient();

  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads_enriched')
        .select('*', { count: 'exact' });

      // Search filter
      if (filters.search) {
        query = query.or(`business_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }

      // Niche filter
      if (filters.niche !== 'all') {
        query = query.eq('niche', filters.niche);
      }

      // Geo filters
      if (filters.states.length > 0) {
        query = query.in('state_code', filters.states);
      }
      if (filters.cities.length > 0) {
        query = query.in('city', filters.cities);
      }
      if (filters.metroAreas.length > 0) {
        query = query.in('metro_area', filters.metroAreas);
      }

      // ZIP Radius filter (uses RPC)
      if (filters.zipCenter && filters.zipRadius > 0) {
        // This is complex because we need to filter the base query by the results of leads_within_radius
        // A simpler way is to use a filter condition on latitude/longitude if possible, 
        // but leads_within_radius is already written in SQL.
        // We'll use a subquery-like approach if Supabase supports it, 
        // or just fetch IDs from the RPC first.
        const { data: zipLeads } = await supabase.rpc('leads_within_radius', {
          p_zip: filters.zipCenter,
          p_radius_miles: filters.zipRadius
        });
        if (zipLeads) {
          const ids = zipLeads.map((l: any) => l.id);
          query = query.in('id', ids);
        }
      }

      // Website status
      if (filters.websiteStatus.length > 0) {
        query = query.in('website_status', filters.websiteStatus);
      }

      // Pipeline status
      if (filters.pipelineStatus.length > 0) {
        query = query.in('pipeline_status', filters.pipelineStatus);
      }

      // Rating/Score sliders
      if (filters.minRating > 0) {
        query = query.gte('yelp_rating', filters.minRating / 10);
      }
      if (filters.maxRating < 50) {
        query = query.lte('yelp_rating', filters.maxRating / 10);
      }
      if (filters.minScore > 0) {
        query = query.gte('qualification_score', filters.minScore);
      }
      if (filters.minReviews > 0) {
        query = query.gte('yelp_review_count', filters.minReviews);
      }

      const { data, count, error } = await query
        .order('qualification_score', { ascending: false })
        .limit(1000); // Limit for virtualization

      if (error) throw error;
      return { leads: data || [], count: count || 0 };
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
