"use client";

import MainCenter from "@/components/MainCenter";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function StudentViewPage() {
  const { studentProfile } = useUserProfile();

  return <MainCenter studentProfile={studentProfile} />;
}