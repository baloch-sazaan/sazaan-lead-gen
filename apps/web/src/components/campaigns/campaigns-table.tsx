'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useCampaigns } from '@/lib/hooks/use-campaigns';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { 
  Users, 
  Calendar, 
  ChevronRight, 
  MoreHorizontal,
  Target
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  description: string;
  niche: string;
  status: string;
  total_leads: number;
  created_at: string;
}

const columnHelper = createColumnHelper<Campaign>();

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  active: 'bg-accent-success/10 text-accent-success border-accent-success/20',
  completed: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
  archived: 'bg-accent-danger/10 text-accent-danger border-accent-danger/20',
};

export function CampaignsTable() {
  const { data: campaigns, isLoading } = useCampaigns();

  const columns = React.useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Campaign',
      cell: (info) => (
        <Link 
          href={`/campaigns/${info.row.original.id}`}
          className="flex flex-col cursor-pointer group"
        >
          <span className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">
            {info.getValue()}
          </span>
          <span className="text-[10px] text-text-muted truncate max-w-[300px]">
            {info.row.original.description || 'No description'}
          </span>
        </Link>
      ),
    }),
    columnHelper.accessor('niche', {
      header: 'Niche',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Target size={14} className="text-text-muted" />
          <span className="text-sm font-medium text-text-secondary capitalize">
            {info.getValue()}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor('total_leads', {
      header: 'Leads',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Users size={14} className="text-text-muted" />
          <span className="text-sm font-medium text-text-secondary">
            {info.getValue() || 0}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_COLORS[info.getValue()] || STATUS_COLORS.draft}`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('created_at', {
      header: 'Created',
      cell: (info) => (
        <div className="flex items-center gap-2 text-text-muted">
          <Calendar size={14} />
          <span className="text-xs">
            {format(new Date(info.getValue()), 'MMM d, yyyy')}
          </span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 glass hover:bg-white/5 rounded-lg transition-all text-text-muted hover:text-text-primary">
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass border-white/10 bg-bg-surface/90 backdrop-blur-xl text-text-primary">
              <DropdownMenuItem className="text-xs hover:bg-white/5 cursor-pointer">
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs hover:bg-white/5 cursor-pointer text-accent-danger">
                Delete Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link 
            href={`/campaigns/${row.original.id}`}
            className="p-1.5 glass hover:bg-accent-primary/20 rounded-lg transition-all text-text-muted hover:text-accent-primary"
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: campaigns || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full glass bg-white/5 rounded-xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (!campaigns?.length) {
    return (
      <div className="glass-panel rounded-xl p-12 flex flex-col items-center justify-center border-dashed border-2 border-white/[0.1] bg-transparent text-center">
        <Users size={48} className="text-text-muted mb-4 opacity-20" />
        <h3 className="text-lg font-bold text-text-primary mb-1">No campaigns found</h3>
        <p className="text-text-muted max-w-xs">
          Create your first campaign to start organizing your leads for outreach.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-white/5 bg-white/[0.03]">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-5 text-left text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr 
              key={row.id}
              className="border-b border-white/5 hover:bg-white/[0.03] transition-all group"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-4"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
