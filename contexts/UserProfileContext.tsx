"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export type Role = "student" | "admin" | "superadmin" | null;

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  program: string;
  year_section: string;
  avatar_url: string | null;
  student_number?: string | null;
  phone?: string | null;
  gender?: string | null;
  age?: number | null;
}

interface UserProfileContextValue {
  role: Role;
  studentProfile: StudentProfile | null;
  refreshUserData: () => Promise<void>;
  updateAvatar: (newUrl: string) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const [profileRes, studentRes] = await Promise.all([
      supabase.from("profiles").select("role, email, avatar_url").eq("id", user.id).single(),
      // maybeSingle(): admins/superadmins may have no student_profiles row,
      // and that should resolve to null rather than an error.
      supabase
        .from("student_profiles")
        .select("full_name, program, year_section, student_number, phone, gender, age")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (profileRes.data) setRole(profileRes.data.role as Role);

    if (studentRes.data) {
      setStudentProfile({
        id: user.id,
        email: profileRes.data?.email ?? "",
        avatar_url: profileRes.data?.avatar_url ?? null,
        ...studentRes.data,
      } as StudentProfile);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const updateAvatar = (newUrl: string) => {
    setStudentProfile((prev) => (prev ? { ...prev, avatar_url: newUrl } : prev));
  };

  return (
    <UserProfileContext.Provider value={{ role, studentProfile, refreshUserData: fetchUserData, updateAvatar }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used inside a UserProfileProvider");
  }
  return ctx;
}