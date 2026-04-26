'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLeads } from '@/lib/hooks/use-leads';
import { QualificationBadge } from './qualification-badge';
import { WebsiteStatusPill } from './website-status-pill';
import { TimezoneCallTimeBadge } from './timezone-call-time-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ExternalLink, 
  Phone, 
  Globe, 
  Star, 
  ChevronRight, 
  MoreHorizontal,
  Mail
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { LeadDetailDrawer } from './lead-detail-drawer';

interface Lead {
  id: string;
  business_name: string;
  phone: string;
  website_url: string;
  yelp_rating: number;
  yelp_review_count: number;
  website_status: string;
  qualification_score: number;
  city: string;
  state_code: string;
  timezone: string;
  pipeline_status: string;
  niche: string;
}

const columnHelper = createColumnHelper<Lead>();

const PIPELINE_COLORS: Record<string, string> = {
  new: 'bg-accent-info/10 text-accent-info border-accent-info/20',
  contacted: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
  interested: 'bg-accent-success/10 text-accent-success border-accent-success/20',
  not_interested: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  converted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export function LeadsTable({ 
  onSelectionChange 
}: { 
  onSelectionChange: (ids: string[]) => void 
}) {
  const { data, isLoading, refetch } = useLeads();
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const parentRef = React.useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic update
    toast.success(`Pipeline updated to ${newStatus}`);
    
    const { error } = await supabase
      .from('leads')
      .update({ pipeline_status: newStatus })
      .eq('id', leadId);

    if (error) {
      toast.error('Failed to update status');
      refetch();
    }
  };

  const columns = React.useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          className="border-white/20 data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          className="border-white/20 data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
        />
      ),
      size: 40,
    }),
    columnHelper.accessor('business_name', {
      header: 'Business',
      cell: (info) => (
        <div 
          className="flex flex-col cursor-pointer group"
          onClick={() => setSelectedLead(info.row.original)}
        >
          <span className="font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate max-w-[200px]">
            {info.getValue()}
          </span>
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Star size={10} className="text-accent-warning fill-accent-warning" />
            {info.row.original.yelp_rating} ({info.row.original.yelp_review_count} reviews)
          </span>
        </div>
      ),
      size: 250,
    }),
    columnHelper.accessor('city', {
      header: 'Location',
      cell: (info) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">
            {info.getValue()}, {info.row.original.state_code}
          </span>
          <TimezoneCallTimeBadge timezone={info.row.original.timezone} />
        </div>
      ),
      size: 180,
    }),
    columnHelper.accessor('pipeline_status', {
      header: 'Pipeline',
      cell: (info) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider transition-all hover:brightness-125 ${PIPELINE_COLORS[info.getValue()] || PIPELINE_COLORS.new}`}>
              {info.getValue()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass border-white/10 bg-bg-surface/90 backdrop-blur-xl text-text-primary">
            {Object.keys(PIPELINE_COLORS).map((status) => (
              <DropdownMenuItem 
                key={status}
                onClick={() => handleStatusChange(info.row.original.id, status)}
                className="text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 cursor-pointer"
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 120,
    }),
    columnHelper.accessor('qualification_score', {
      header: 'Score',
      cell: (info) => <QualificationBadge score={info.getValue()} />,
      size: 100,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.phone && (
            <a 
              href={`tel:${row.original.phone}`}
              className="p-1.5 glass hover:bg-emerald-500/20 rounded-lg transition-all text-text-muted hover:text-emerald-400"
            >
              <Phone size={14} />
            </a>
          )}
          <button 
            onClick={() => setSelectedLead(row.original)}
            className="p-1.5 glass hover:bg-accent-primary/20 rounded-lg transition-all text-text-muted hover:text-accent-primary"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ),
      size: 80,
    }),
  ], []);

  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: data?.leads || [],
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      // We need to wait for the state to update to get the count
    },
    getCoreRowModel: getCoreRowModel(),
  });

  React.useEffect(() => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => (data?.leads || [])[parseInt(index)]?.id
    ).filter(Boolean);
    onSelectionChange(selectedIds);
  }, [rowSelection, onSelectionChange, data?.leads]);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full glass bg-white/5 rounded-xl border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[700px] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-white/5 bg-white/[0.03]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-5 text-left text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]"
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          </table>
        </div>
        
        <div 
          ref={parentRef} 
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  className={`absolute top-0 left-0 w-full flex items-center border-b border-white/5 hover:bg-white/[0.03] transition-all group ${
                    row.getIsSelected() ? 'bg-accent-primary/5' : ''
                  }`}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="px-6 py-2"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <LeadDetailDrawer 
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </>
  );
}
