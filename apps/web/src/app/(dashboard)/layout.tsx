'use client';

import React from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/aceternity/sidebar';
import { Users, Database, Megaphone, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const links = [
    {
      label: 'Leads',
      href: '/leads',
      icon: <Users size={20} />,
    },
    {
      label: 'Ingestion Jobs',
      href: '/jobs',
      icon: <Database size={20} />,
    },
    {
      label: 'Campaigns',
      href: '/campaigns',
      icon: <Megaphone size={20} />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings size={20} />,
    },
  ];

  return (
    <Sidebar>
      <SidebarBody>
        <div className="flex flex-col flex-1 h-full">
          <div className="mb-8 mt-4 px-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
              S
            </div>
          </div>
          
          <div className="flex flex-col gap-1 flex-1">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
      </SidebarBody>

      <div className="flex-1 h-full overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </Sidebar>
  );
}
