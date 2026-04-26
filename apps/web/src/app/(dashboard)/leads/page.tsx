'use client';

import { LeadsFilters } from '@/components/leads/leads-filters';
import { LeadsTable } from '@/components/leads/leads-table';
import { BulkActionsBar } from '@/components/leads/bulk-actions-bar';
import { useState } from 'react';

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
        <LeadsFilters />
        <LeadsTable onSelectionChange={setSelectedIds} />
      </div>

      <BulkActionsBar 
        selectedIds={selectedIds} 
        onClear={() => setSelectedIds([])} 
      />
    </div>
  );
}
