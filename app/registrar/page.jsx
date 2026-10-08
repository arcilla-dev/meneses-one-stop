import StudentRegistrar from "@/components/registrar/student/StudentRegistrar";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

// TODO: render <AdminRegistrar /> based on user role
export default function RegistrarPage() {
  return (
    <UserProfileProvider>
      <StudentRegistrar />
    </UserProfileProvider>
  );
}
