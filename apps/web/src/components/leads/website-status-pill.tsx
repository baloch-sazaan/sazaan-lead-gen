'use client';

import { cn } from '@/lib/utils';
import { 
  Globe, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldAlert 
} from 'lucide-react';

type WebsiteStatus = 
  | 'pending' 
  | 'valid' 
  | 'slow' 
  | 'broken_404' 
  | 'broken_500' 
  | 'broken_dns' 
  | 'ssl_error' 
  | 'timeout' 
  | 'no_website' 
  | 'error';

interface WebsiteStatusPillProps {
  status: WebsiteStatus;
  loadTime?: number | null;
  className?: string;
}

const STATUS_CONFIG: Record<WebsiteStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'Checking...', icon: Clock, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  valid: { label: 'Healthy', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  slow: { label: 'Slow', icon: Clock, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  broken_404: { label: '404 Broken', icon: AlertTriangle, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  broken_500: { label: 'Server Error', icon: ShieldAlert, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  broken_dns: { label: 'DNS Error', icon: Globe, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
  ssl_error: { label: 'SSL Error', icon: ShieldAlert, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
  timeout: { label: 'Timeout', icon: Clock, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  no_website: { label: 'No Website', icon: XCircle, color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
  error: { label: 'Error', icon: AlertTriangle, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

export function WebsiteStatusPill({ status, loadTime, className }: WebsiteStatusPillProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.error;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border glass-morphism transition-all duration-300 hover:scale-105",
      config.color,
      className
    )}>
      <Icon size={12} className="shrink-0" />
      <span>{config.label}</span>
      {loadTime && status === 'valid' && (
        <span className="opacity-60 ml-1 border-l border-white/10 pl-1.5">
          {loadTime}ms
        </span>
      )}
    </div>
  );
}
