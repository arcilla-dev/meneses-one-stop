"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Office } from "@/lib/adminHome";

const supabase = createClient();

export type Role = "student" | "admin" | "superadmin" | null;

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  // The following are only populated for students — null/undefined for admin/superadmin
  program?: string | null;
  year_section?: string | null;
  student_number?: string | null;
  phone?: string | null;
  gender?: string | null;
  age?: number | null;
}

interface UserProfileContextValue {
  role: Role;
  office: Office | null;
  studentProfile: StudentProfile | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  updateAvatar: (newUrl: string) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [office, setOffice] = useState<Office | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        setOffice(null);
        setStudentProfile(null);
        return;
      }

      const [profileRes, studentRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, office, email, avatar_url, full_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("student_profiles")
          .select("full_name, program, year_section, student_number, phone, gender, age")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (profileRes.data) {
        setRole(profileRes.data.role as Role);
        setOffice((profileRes.data.office as Office) ?? null);

        setStudentProfile({
          id: user.id,
          email: profileRes.data.email ?? "",
          avatar_url: profileRes.data.avatar_url ?? null,
          full_name: studentRes.data?.full_name ?? profileRes.data.full_name ?? "",
          program: studentRes.data?.program ?? null,
          year_section: studentRes.data?.year_section ?? null,
          student_number: studentRes.data?.student_number ?? null,
          phone: studentRes.data?.phone ?? null,
          gender: studentRes.data?.gender ?? null,
          age: studentRes.data?.age ?? null,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchUserData);
  }, []);

  const updateAvatar = (newUrl: string) => {
    setStudentProfile((prev) => (prev ? { ...prev, avatar_url: newUrl } : prev));
  };

  return (
    <UserProfileContext.Provider
      value={{ role, office, studentProfile, loading, refreshUserData: fetchUserData, updateAvatar }}
    >
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