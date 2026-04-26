'use client';

import { cn } from '@/lib/utils';
import { Target, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

interface QualificationBadgeProps {
  score: number;
  className?: string;
}

export function QualificationBadge({ score, className }: QualificationBadgeProps) {
  const getScoreConfig = (s: number) => {
    if (s >= 80) return { 
      label: 'Elite Lead', 
      icon: ShieldCheck, 
      color: 'from-emerald-400 to-cyan-400 text-emerald-950',
      shadow: 'shadow-emerald-500/20'
    };
    if (s >= 60) return { 
      label: 'High Quality', 
      icon: Zap, 
      color: 'from-blue-400 to-indigo-400 text-blue-950',
      shadow: 'shadow-blue-500/20'
    };
    if (s >= 40) return { 
      label: 'Potential', 
      icon: TrendingUp, 
      color: 'from-amber-300 to-orange-400 text-amber-950',
      shadow: 'shadow-amber-500/20'
    };
    return { 
      label: 'Cold Lead', 
      icon: Target, 
      color: 'from-slate-400 to-slate-500 text-slate-950',
      shadow: 'shadow-slate-500/10'
    };
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;

  return (
    <div className={cn(
      "relative group flex items-center gap-2 p-0.5 pr-3 rounded-lg overflow-hidden transition-all duration-500 hover:scale-105",
      config.shadow,
      className
    )}>
      {/* Background Gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-90 transition-opacity group-hover:opacity-100",
        config.color
      )} />
      
      {/* Icon Section */}
      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-md bg-black/20 backdrop-blur-sm ml-0.5">
        <Icon size={16} />
      </div>
      
      {/* Label & Score */}
      <div className="relative z-10 flex flex-col items-start leading-none gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
          {config.label}
        </span>
        <span className="text-sm font-black italic tracking-tighter">
          {score}<span className="text-[10px] ml-0.5 not-italic opacity-60">SCORE</span>
        </span>
      </div>

      {/* Decorative Glow */}
      <div className={cn(
        "absolute -right-4 -top-4 w-12 h-12 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity bg-white",
      )} />
    </div>
  );
}
