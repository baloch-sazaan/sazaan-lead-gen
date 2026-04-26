import { JobTriggerForm } from '@/components/jobs/job-trigger-form';

export default function JobsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text-primary">Ingestion Jobs</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <JobTriggerForm />
        </div>
        <div className="lg:col-span-2 glass-panel rounded-xl p-8 min-h-[400px] flex items-center justify-center border-dashed border-2 border-white/[0.1] bg-transparent">
          <p className="text-text-muted">Job progress table will go here</p>
        </div>
      </div>
    </div>
  );
}
