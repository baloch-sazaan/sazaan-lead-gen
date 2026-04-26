import { createClient } from '@supabase/supabase-js';
import { runJob } from './job-runner';
import { logger } from './lib/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let isProcessing = false;

async function processNextJob() {
  if (isProcessing) return;

  // Look for the next pending job
  const { data: jobs, error } = await supabase
    .from('ingestion_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    logger.error({ err: error }, 'Failed to fetch jobs');
    return;
  }

  if (!jobs || jobs.length === 0) {
    logger.debug('No pending jobs');
    return;
  }

  isProcessing = true;
  const job = jobs[0];
  logger.info({ jobId: job.id, niche: job.niche, state: job.state_code }, 'Starting job');

  try {
    await runJob(job as any);
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'Job failed');
  } finally {
    isProcessing = false;
    // Check immediately if more jobs are queued
    setImmediate(processNextJob);
  }
}

// Listen for new jobs via realtime
supabase
  .channel('jobs-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'ingestion_jobs',
  }, () => {
    logger.info('New job detected via realtime');
    processNextJob();
  })
  .subscribe((status) => {
    logger.info({ status }, 'Realtime subscription status');
  });

// Also poll every 60 seconds as a fallback
setInterval(processNextJob, 60000);

// Run once on startup to catch any pending jobs from before the worker started
processNextJob();

logger.info('Scraper worker started, listening for jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await supabase.removeAllChannels();
  process.exit(0);
});
