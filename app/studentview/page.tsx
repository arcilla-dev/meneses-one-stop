'use client';

import { useState } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import MainCenter from '@/components/MainCenter';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLink, setActiveLink] = useState('home');

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#fcdced]">
      <TopHeader onToggleSidebar={() => setSidebarOpen((p) => !p)} sidebarOpen={sidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} activeLink={activeLink} onSelectLink={setActiveLink} />
        <main className="flex-1 overflow-hidden flex flex-col relative z-0">
          <MainCenter activeLink={activeLink} />
        </main>
      </div>
    </div>
  );
}