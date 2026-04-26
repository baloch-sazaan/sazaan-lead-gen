export type Database = {
  public: {
    Tables: {
      ingestion_jobs: {
        Row: {
          id: string;
          niche: string;
          sources: string[];
          status: 'pending' | 'running' | 'completed' | 'failed';
          state_code: string | null;
          city: string | null;
          zip_code: string | null;
          zip_radius_miles: number | null;
          total_found: number | null;
          total_inserted: number | null;
          total_skipped_duplicate: number | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
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
        Update: Partial<Database['public']['Tables']['ingestion_jobs']['Insert']>;
      };
    };
  };
};
