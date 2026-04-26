import { createClient } from '@supabase/supabase-js';
import { scrapeYelp } from './scrapers/yelp';
import { scrapeYellowPages } from './scrapers/yellow-pages';
import { dedupAndInsert } from './lib/dedup';
import { checkWebsiteHealth } from './workers/website-health';
import { logger } from './lib/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface IngestionJob {
  id: string;
  niche: string;
  sources: string[];
  state_code: string | null;
  city: string | null;
  zip_code: string | null;
  zip_radius_miles: number | null;
}

export async function runJob(job: IngestionJob) {
  await supabase
    .from('ingestion_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    // Determine search targets based on geo input
    const searchTargets = await resolveSearchTargets(job);
    logger.info({ targetCount: searchTargets.length }, 'Resolved search targets');

    let allLeads: any[] = [];

    for (const target of searchTargets) {
      const sources = job.sources || ['yelp', 'yellow_pages'];

      for (const source of sources) {
        try {
          const leads = source === 'yelp'
            ? await scrapeYelp({ niche: job.niche as any, ...target })
            : await scrapeYellowPages({ niche: job.niche as any, ...target });

          allLeads.push(...leads.map((l: any) => ({ ...l, job_id: job.id })));

          // Update progress
          await supabase
            .from('ingestion_jobs')
            .update({ total_found: allLeads.length })
            .eq('id', job.id);
        } catch (err) {
          logger.error({ err, source, target }, 'Source scrape failed');
        }
      }
    }

    // Dedup across sources (by phone+name normalized) and insert
    const { inserted, skipped } = await dedupAndInsert(allLeads);

    // Trigger health checks (in same process, run async after job)
    setImmediate(() => runHealthChecksForJob(job.id));

    await supabase
      .from('ingestion_jobs')
      .update({
        status: 'completed',
        total_found: allLeads.length,
        total_inserted: inserted,
        total_skipped_duplicate: skipped,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    logger.info({ jobId: job.id, inserted, skipped }, 'Job completed');
  } catch (err: any) {
    await supabase
      .from('ingestion_jobs')
      .update({
        status: 'failed',
        error_message: err.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);
    throw err;
  }
}

async function resolveSearchTargets(
  job: IngestionJob
): Promise<Array<{ city: string; state_code: string; zip?: string }>> {
  // Case 1: ZIP + radius — get all cities within radius
  if (job.zip_code && job.zip_radius_miles) {
    const { data: centerZip } = await supabase
      .from('geo_zips')
      .select('latitude, longitude')
      .eq('zip', job.zip_code)
      .single();

    if (!centerZip) throw new Error(`ZIP ${job.zip_code} not found`);

    // Get cities within radius
    const { data: zips } = await supabase.rpc('zips_within_radius', {
      p_zip: job.zip_code,
      p_radius_miles: job.zip_radius_miles,
    });

    const uniqueCities = new Map<string, { city: string; state_code: string }>();
    (zips || []).forEach((z: any) => {
      const key = `${z.city},${z.state_code}`;
      if (!uniqueCities.has(key)) {
        uniqueCities.set(key, { city: z.city, state_code: z.state_code });
      }
    });
    return Array.from(uniqueCities.values()).slice(0, 20); // Cap to avoid runaway
  }

  // Case 2: City + State — single target
  if (job.city && job.state_code) {
    return [{ city: job.city, state_code: job.state_code }];
  }

  // Case 3: State only — get top cities by population
  if (job.state_code) {
    const { data: cities } = await supabase
      .from('geo_zips')
      .select('city, state_code, population')
      .eq('state_code', job.state_code)
      .order('population', { ascending: false })
      .limit(10);

    const unique = new Map<string, { city: string; state_code: string }>();
    (cities || []).forEach((c: any) => {
      if (!unique.has(c.city)) unique.set(c.city, { city: c.city, state_code: c.state_code });
    });
    return Array.from(unique.values());
  }

  throw new Error('No valid geo target on job');
}

async function runHealthChecksForJob(jobId: string) {
  const { data: leads } = await supabase
    .from('leads')
    .select('id, website_url')
    .eq('job_id', jobId)
    .eq('website_status', 'pending')
    .not('website_url', 'is', null)
    .limit(200);

  for (const lead of leads || []) {
    try {
      const result = await checkWebsiteHealth(lead.website_url!);
      await supabase
        .from('leads')
        .update({
          website_status: result.status,
          website_load_time_ms: 'loadTime' in result ? result.loadTime : null,
          website_tech_stack: 'techStack' in result ? result.techStack : null,
          website_last_checked_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
    } catch (err) {
      logger.error({ err, leadId: lead.id }, 'Health check failed');
    }
  }
}
