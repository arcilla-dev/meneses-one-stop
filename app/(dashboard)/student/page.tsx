"use client";

import MainCenter from "@/components/MainCenter";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function StudentPage() {
  const { studentProfile } = useUserProfile();

  return <MainCenter studentProfile={studentProfile} />;
}