'use client';

import { LeadsFilters } from '@/components/leads/leads-filters';
import { LeadsTable } from '@/components/leads/leads-table';
import { BulkActionsBar } from '@/components/leads/bulk-actions-bar';
import { useState, Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function LeadsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold text-text-primary tracking-tight">
          Lead Database
        </h1>
        <p className="text-text-muted">
          Manage and qualify your leads with AI-powered scoring.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Suspense fallback={<div className="h-20 glass rounded-2xl animate-pulse" />}>
          <LeadsFilters />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 glass rounded-2xl animate-pulse" />}>
          <LeadsTable onSelectionChange={setSelectedIds} />
        </Suspense>
      </div>

      <Suspense>
        <BulkActionsBar 
          selectedIds={selectedIds} 
          onClear={() => setSelectedIds([])} 
        />
      </Suspense>
    </div>
  );
}

