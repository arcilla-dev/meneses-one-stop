"use client";

import { useState, useEffect } from "react";
import TopHeader from "@/components/TopHeader";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Role = "student" | "admin" | "superadmin" | null;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) setRole(profile.role as Role);
    };

    fetchRole();
  }, []);

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#fcdced]">
      <TopHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
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