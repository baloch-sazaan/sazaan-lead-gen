'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useCampaigns } from '@/lib/hooks/use-campaigns';
import { Layers } from 'lucide-react';

export function AddToCampaignDialog({
  leadIds,
  isOpen,
  onClose,
  onSuccess
}: {
  leadIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { data: campaigns } = useCampaigns();
  const supabase = createClient();

  const handleAdd = async () => {
    if (!selectedCampaignId) return;
    
    setIsSubmitting(true);
    try {
      const inserts = leadIds.map(leadId => ({
        campaign_id: selectedCampaignId,
        lead_id: leadId
      }));

      const { error } = await supabase
        .from('campaign_leads')
        .upsert(inserts, { onConflict: 'campaign_id,lead_id' });

      if (error) throw error;

      // Update total leads count in campaign
      const { count } = await supabase
        .from('campaign_leads')
        .select('lead_id', { count: 'exact', head: true })
        .eq('campaign_id', selectedCampaignId);

      await supabase
        .from('campaigns')
        .update({ total_leads: count || 0 })
        .eq('id', selectedCampaignId);

      toast.success(`Added ${leadIds.length} leads to campaign`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add leads to campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-white/10 bg-bg-surface/95 backdrop-blur-2xl text-text-primary sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold flex items-center gap-2">
            <Layers className="text-accent-primary" size={20} />
            Add to Campaign
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <p className="text-sm text-text-muted">
            Select a campaign to add the {leadIds.length} selected leads to.
          </p>
          
          <Select onValueChange={setSelectedCampaignId} value={selectedCampaignId || undefined}>
            <SelectTrigger className="bg-white/5 border-white/10 focus:border-accent-primary/50">
              <SelectValue placeholder="Choose a campaign..." />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 bg-bg-surface text-text-primary">
              {campaigns?.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.niche})
                </SelectItem>
              ))}
              {campaigns?.length === 0 && (
                <p className="p-2 text-xs text-text-muted">No campaigns yet</p>
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={!selectedCampaignId || isSubmitting}
            className="bg-accent-primary hover:bg-accent-glow text-white min-w-[100px]"
          >
            {isSubmitting ? 'Adding...' : 'Add Leads'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
