import { CampaignsTable } from '@/components/campaigns/campaigns-table';
import { CreateCampaignDialog } from '@/components/campaigns/create-campaign-dialog';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">Campaigns</h1>
          <p className="text-text-muted">Organize and manage your lead outreach lists.</p>
        </div>
        <CreateCampaignDialog />
      </div>
      
      <div className="space-y-4">
        <Suspense fallback={<div className="h-96 glass rounded-2xl animate-pulse" />}>
          <CampaignsTable />
        </Suspense>
      </div>
    </div>
  );
}

