'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Calendar, 
  ArrowLeft, 
  Download, 
  Trash2,
  ExternalLink,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const { data: campaign, isLoading: isCampaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: leads, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['campaign-leads', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_leads')
        .select(`
          lead:leads (
            id, business_name, phone, website_url, 
            city, state_code, yelp_rating, qualification_score
          )
        `)
        .eq('campaign_id', id);
      if (error) throw error;
      return data.map(d => d.lead);
    }
  });

  const handleExport = async () => {
    if (!leads?.length) return;
    
    const promise = async () => {
      const response = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: leads.map(l => (l as any).id) }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${campaign.name}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    };

    toast.promise(promise(), {
      loading: 'Exporting campaign leads...',
      success: 'Campaign exported successfully',
      error: 'Failed to export campaign',
    });
  };

  if (isCampaignLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!campaign) {
    return <div className="p-8">Campaign not found</div>;
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4">
        <Link 
          href="/campaigns" 
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Campaigns
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-display font-bold text-text-primary tracking-tight">
              {campaign.name}
            </h1>
            <p className="text-text-muted">{campaign.description}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="glass border-white/10 hover:bg-white/5 gap-2"
              onClick={handleExport}
              disabled={!leads?.length}
            >
              <Download size={16} />
              Export CSV
            </Button>
            <Button variant="outline" className="glass border-rose-500/20 text-rose-400 hover:bg-rose-500/10 gap-2">
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <StatCard 
            icon={<Target className="text-accent-primary" size={20} />}
            label="Niche"
            value={campaign.niche}
            className="capitalize"
          />
          <StatCard 
            icon={<Users className="text-accent-success" size={20} />}
            label="Total Leads"
            value={leads?.length || 0}
          />
          <StatCard 
            icon={<Calendar className="text-accent-warning" size={20} />}
            label="Created"
            value={format(new Date(campaign.created_at), 'MMM d, yyyy')}
          />
          <StatCard 
            icon={<span className="text-accent-info font-bold">S</span>}
            label="Status"
            value={campaign.status}
            className="capitalize"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Leads in Campaign</h2>
        {isLeadsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full glass" />)}
          </div>
        ) : leads?.length ? (
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.03]">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">{lead.business_name}</div>
                      <div className="text-xs text-text-muted">{lead.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {lead.city}, {lead.state_code}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${lead.qualification_score > 70 ? 'text-accent-success' : 'text-text-muted'}`}>
                        {lead.qualification_score}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/leads?id=${lead.id}`}
                        className="text-accent-primary hover:text-accent-glow p-2 inline-block transition-colors"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-12 text-center border-dashed border-2 border-white/10">
            <p className="text-text-muted">No leads added to this campaign yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, className = "" }: { icon: React.ReactNode, label: string, value: string | number, className?: string }) {
  return (
    <div className="glass p-4 rounded-xl border border-white/5 space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
      </div>
      <div className={`text-xl font-display font-bold text-text-primary ${className}`}>{value}</div>
    </div>
  );
}
