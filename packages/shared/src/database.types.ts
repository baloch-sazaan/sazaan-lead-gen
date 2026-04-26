type IngestionJobInsert = {
  id?: string;
  niche: string;
  sources: string[];
  status?: 'pending' | 'running' | 'completed' | 'failed';
  state_code?: string | null;
  city?: string | null;
  zip_code?: string | null;
  zip_radius_miles?: number | null;
  total_found?: number | null;
  total_inserted?: number | null;
  total_skipped_duplicate?: number | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
};

type LeadInsert = {
  id?: string;
  job_id?: string | null;
  niche: string;
  business_name: string;
  street_address?: string | null;
  city: string;
  state_code: string;
  zip_code?: string | null;
  phone?: string | null;
  phone_normalized?: string | null;
  website_url?: string | null;
  website_status?: string | null;
  website_load_time_ms?: number | null;
  website_tech_stack?: Record<string, boolean> | null;
  website_last_checked_at?: string | null;
  yelp_id?: string | null;
  yelp_url?: string | null;
  yelp_rating?: number | null;
  yelp_review_count?: number | null;
  yellow_pages_id?: string | null;
  yellow_pages_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  primary_source?: string | null;
  qualification_score?: number | null;
  pipeline_status?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      ingestion_jobs: {
        Row: Required<IngestionJobInsert> & {
          id: string;
          created_at: string;
        };
        Insert: IngestionJobInsert;
        Update: Partial<IngestionJobInsert>;
      };
      leads: {
        Row: Required<LeadInsert> & {
          id: string;
          created_at: string;
        };
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
      };
      geo_zips: {
        Row: {
          zip: string;
          city: string;
          state_code: string;
          state_name: string;
          latitude: number;
          longitude: number;
          population: number | null;
          timezone: string | null;
        };
        Insert: {
          zip: string;
          city: string;
          state_code: string;
          state_name: string;
          latitude: number;
          longitude: number;
          population?: number | null;
          timezone?: string | null;
        };
        Update: Partial<Database['public']['Tables']['geo_zips']['Insert']>;
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          niche: string;
          status: string;
          total_leads: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          niche: string;
          status?: string;
          total_leads?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };
      campaign_leads: {
        Row: {
          campaign_id: string;
          lead_id: string;
          added_at: string;
        };
        Insert: {
          campaign_id: string;
          lead_id: string;
          added_at?: string;
        };
        Update: Partial<Database['public']['Tables']['campaign_leads']['Insert']>;
      };
      us_states: {
        Row: {
          code: string;
          name: string;
        };
        Insert: {
          code: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['us_states']['Insert']>;
      };
    };
    Views: {
      leads_enriched: {
        Row: LeadInsert & {
          id: string;
          state_name: string | null;
          metro_area: string | null;
          timezone: string | null;
          latitude: number | null;
          longitude: number | null;
        };
      };
    };
    Functions: {
      leads_within_radius: {
        Args: { p_zip: string; p_radius_miles: number };
        Returns: Array<{ id: string }>;
      };
      zips_within_radius: {
        Args: { p_zip: string; p_radius_miles: number };
        Returns: Array<{ zip: string; city: string; state_code: string }>;
      };
    };
  };
};
