'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Archive, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AddToCampaignDialog } from '@/components/campaigns/add-to-campaign-dialog';

export function BulkActionsBar({ 
  selectedIds, 
  onClear 
}: { 
  selectedIds: string[]; 
  onClear: () => void;
}) {
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const selectedCount = selectedIds.length;

  const handleExport = async () => {
    const promise = async () => {
      const response = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedIds }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sazaan-leads-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    };

    toast.promise(promise(), {
      loading: 'Preparing CSV export...',
      success: 'Leads exported successfully',
      error: 'Failed to export leads',
    });
  };

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-morphism bg-accent-primary/20 backdrop-blur-xl border border-accent-primary/30 px-6 py-4 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.2)] flex items-center gap-6">
              <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-white font-bold text-sm">
                  {selectedCount}
                </div>
                <span className="text-sm font-semibold text-text-primary">leads selected</span>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleExport}
                  className="hover:bg-white/10 text-text-primary gap-2"
                >
                  <Download size={14} /> Export CSV
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCampaignDialogOpen(true)}
                  className="hover:bg-white/10 text-text-primary gap-2"
                >
                  <UserPlus size={14} /> Add to Campaign
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 gap-2"
                >
                  <Archive size={14} /> Archive
                </Button>
              </div>

              <button 
                onClick={onClear}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddToCampaignDialog 
        leadIds={selectedIds}
        isOpen={isCampaignDialogOpen}
        onClose={() => setIsCampaignDialogOpen(false)}
        onSuccess={() => {
          setIsCampaignDialogOpen(false);
          onClear();
        }}
      />
    </>
  );
}
