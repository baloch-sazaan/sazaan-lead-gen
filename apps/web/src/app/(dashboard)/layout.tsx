'use client';

import React from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/aceternity/sidebar';
import { Users, Briefcase, Megaphone, Settings, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

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
            {/* The title visibility is handled by the Sidebar component in a full implementation, but for simplicity we keep it hidden when collapsed */}
          </div>
          
          <div className="flex flex-col gap-1 flex-1">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
          
          <div className="mt-auto">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 p-2 w-full rounded-lg hover:bg-white/[0.05] transition-colors text-text-secondary hover:text-text-primary whitespace-nowrap"
            >
              <div className="shrink-0 flex items-center justify-center text-accent-danger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </SidebarBody>
      <div className="flex-1 h-full overflow-y-auto p-8 relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </Sidebar>
  );
}
