'use client';

import React from 'react';

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div
      className={`absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-primary/40 via-bg-base to-bg-base ${className}`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent-glow blur-[100px] opacity-20 animate-pulse" />
    </div>
  );
};
