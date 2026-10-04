"use client";

import { useState } from "react";
import TopHeader from "@/components/TopHeader";
import Sidebar from "@/components/Sidebar";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";
import MainCenter from "@/components/MainCenter";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { role, studentProfile } = useUserProfile();

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#fcdced]">
      <TopHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        studentProfile={studentProfile}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} role={role} />

        <main className="flex-1 overflow-hidden flex flex-col relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProfileProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserProfileProvider>
  );
}