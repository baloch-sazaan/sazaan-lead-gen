'use client';

import { format, toZonedTime } from 'date-fns-tz';

export function TimezoneCallTimeBadge({ timezone }: { timezone: string | null }) {
  if (!timezone) return null;

  try {
    const now = new Date();
    const localTime = toZonedTime(now, timezone);
    const hour = localTime.getHours();

    let label: string;
    let color: string;

    if (hour >= 9 && hour < 17) {
      label = `${format(localTime, 'h:mm a', { timeZone: timezone })} — Call now`;
      color = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    } else if (hour >= 7 && hour < 9) {
      label = `${format(localTime, 'h:mm a', { timeZone: timezone })} — Too early`;
      color = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    } else if (hour >= 17 && hour < 20) {
      label = `${format(localTime, 'h:mm a', { timeZone: timezone })} — Closing soon`;
      color = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    } else {
      label = `${format(localTime, 'h:mm a', { timeZone: timezone })} — Closed`;
      color = 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border glass-morphism ${color}`}>
        {label}
      </span>
    );
  } catch (e) {
    return null;
  }
}
