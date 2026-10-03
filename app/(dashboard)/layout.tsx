"use client";

import { useState, useEffect } from "react";
import TopHeader, { type StudentProfile } from "@/components/TopHeader";
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
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Both queries are independent, so run them in parallel.
      const [profileRes, studentRes] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        // maybeSingle(): admins/superadmins may have no student_profiles row,
        // and that should resolve to null rather than an error.
        supabase
          .from("student_profiles")
          .select("full_name, program, year_section")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (profileRes.data) setRole(profileRes.data.role as Role);
      if (studentRes.data) setStudentProfile(studentRes.data as StudentProfile);
    };

    fetchUserData();
  }, []);

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
