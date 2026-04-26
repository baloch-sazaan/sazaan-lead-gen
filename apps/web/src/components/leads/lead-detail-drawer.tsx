'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { QualificationBadge } from './qualification-badge';
import { WebsiteStatusPill } from './website-status-pill';
import { TimezoneCallTimeBadge } from './timezone-call-time-badge';
import { Phone, Globe, MapPin, Calendar, MessageSquare, ExternalLink, Instagram, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LeadDetailDrawer({ 
  lead, 
  isOpen, 
  onClose 
}: { 
  lead: any; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl glass border-white/10 bg-bg-surface/95 backdrop-blur-2xl text-text-primary p-0">
        <div className="h-full overflow-y-auto scrollbar-none pb-20">
          {/* Header Section */}
          <div className="p-8 space-y-6">
            <SheetHeader className="text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-accent-primary uppercase px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
                  {lead.niche}
                </span>
                <QualificationBadge score={lead.qualification_score} />
              </div>
              <SheetTitle className="text-3xl font-bold tracking-tight text-text-primary pt-2">
                {lead.business_name}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <WebsiteStatusPill status={lead.website_status} />
                <TimezoneCallTimeBadge timezone={lead.timezone} />
              </div>
            </SheetHeader>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button className="bg-accent-primary hover:bg-accent-glow text-white font-semibold rounded-xl h-12 shadow-glow-sm">
                <Phone size={18} className="mr-2" /> Call Lead
              </Button>
              <Button variant="outline" className="glass hover:bg-white/5 border-white/10 rounded-xl h-12">
                <MessageSquare size={18} className="mr-2" /> Add Note
              </Button>
            </div>

            {/* Details Grid */}
            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Contact Details</h4>
                <div className="grid grid-cols-1 gap-4">
                  <DetailItem 
                    icon={<MapPin size={16} />} 
                    label="Address" 
                    value={`${lead.street_address || 'N/A'}, ${lead.city}, ${lead.state_code}`} 
                  />
                  <DetailItem 
                    icon={<Phone size={16} />} 
                    label="Phone" 
                    value={lead.phone || 'N/A'} 
                  />
                  <DetailItem 
                    icon={<Globe size={16} />} 
                    label="Website" 
                    value={lead.website_url}
                    isLink 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Social & Directory</h4>
                <div className="grid grid-cols-2 gap-4">
                  <SocialCard icon={<Instagram size={20} />} label="Instagram" url={lead.instagram_url} />
                  <SocialCard icon={<Facebook size={20} />} label="Facebook" url={lead.facebook_url} />
                  <SocialCard icon={<ExternalLink size={20} />} label="Yelp" url={lead.yelp_url} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailItem({ icon, label, value, isLink }: { icon: any; label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-4 glass rounded-xl border border-white/5">
      <div className="text-accent-primary mt-0.5">{icon}</div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">{label}</p>
        {isLink && value ? (
          <a href={value} target="_blank" className="text-sm font-medium text-accent-primary hover:underline flex items-center gap-1">
            {value.replace(/^https?:\/\//, '')} <ExternalLink size={12} />
          </a>
        ) : (
          <p className="text-sm font-medium text-text-primary">{value || 'Not provided'}</p>
        )}
      </div>
    </div>
  );
}

function SocialCard({ icon, label, url }: { icon: any; label: string; url?: string }) {
  return (
    <a 
      href={url || '#'} 
      target="_blank"
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
        url 
        ? 'glass border-white/10 hover:bg-white/5 cursor-pointer text-text-primary' 
        : 'bg-white/[0.02] border-dashed border-white/5 text-text-muted cursor-not-allowed opacity-50'
      }`}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </a>
  );
}
