'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SidebarLinkProps {
  link: { label: string; href: string; icon: React.ReactNode };
  expanded?: boolean;
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-bg-base overflow-hidden">
      {children}
    </div>
  );
}

export function SidebarBody({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<{ expanded?: boolean }>, { expanded: hovered });
    }
    return child;
  });

  return (
    <div
      className="h-full bg-bg-surface border-r border-bg-border flex flex-col shrink-0 transition-all duration-300 overflow-hidden"
      style={{ width: hovered ? '240px' : '64px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col h-full p-3 gap-2">
        {childrenWithProps}
      </div>
    </div>
  );
}

export function SidebarLink({ link, expanded }: SidebarLinkProps) {
  return (
    <Link
      href={link.href}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-text-secondary hover:text-text-primary whitespace-nowrap"
    >
      <div className="shrink-0 flex items-center justify-center text-accent-primary">
        {link.icon}
      </div>
      <span
        className="font-medium text-sm transition-opacity duration-200"
        style={{ opacity: expanded ? 1 : 0, display: expanded ? 'block' : 'none' }}
      >
        {link.label}
      </span>
    </Link>
  );
}
