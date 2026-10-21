"use client";

import { useState } from "react";
import TopHeader from "@/components/TopHeader";
import Sidebar from "@/components/Sidebar";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { role, office, studentProfile } = useUserProfile();

  const isAdmin = role === "admin" || role === "superadmin";

  // Built from the context, so no extra request
  const adminProfile =
    isAdmin && studentProfile
      ? {
          full_name: studentProfile.full_name,
          avatar_url: studentProfile.avatar_url,
          role,
          office,
        }
      : null;

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#fcdced]">
      <TopHeader
        variant={isAdmin ? "admin" : "student"}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        studentProfile={studentProfile}
        adminProfile={adminProfile}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} role={role} office={office} />

        <main className="flex-1 overflow-hidden flex flex-col relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProfileProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserProfileProvider>
  );
}