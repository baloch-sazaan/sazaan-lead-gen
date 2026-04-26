'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full bg-bg-base overflow-hidden">
      {children}
    </div>
  );
};

export const SidebarBody = ({ children }: { children: React.ReactNode }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <motion.div
      className="h-full bg-bg-surface border-r border-bg-border flex flex-col shrink-0 transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ width: hovered ? '240px' : '64px' }}
      initial={{ width: '64px' }}
    >
      <div className="flex flex-col h-full overflow-hidden p-3 gap-2">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as any, { expanded: hovered });
          }
          return child;
        })}
      </div>
    </motion.div>
  );
};

export const SidebarLink = ({
  link,
  expanded,
}: {
  link: { label: string; href: string; icon: React.ReactNode };
  expanded?: boolean;
}) => {
  return (
    <Link
      href={link.href}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-text-secondary hover:text-text-primary whitespace-nowrap"
    >
      <div className="shrink-0 flex items-center justify-center text-accent-primary">
        {link.icon}
      </div>
      <motion.span
        animate={{ opacity: expanded ? 1 : 0, display: expanded ? 'block' : 'none' }}
        className="font-medium text-sm"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
