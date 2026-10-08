"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LogOut,
  User,
  Megaphone,
  FileText,
  Building2,
  Home,
  Shield,
  UserPlus,
  Users,
  ChevronDown, FileSignature, PlusSquare, GraduationCap, UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUserProfile, type Role } from "@/contexts/UserProfileContext";

interface NavLink {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const STUDENT_LINKS: NavLink[] = [
  { key: "home", label: "Home", icon: Home, href: "/studentview" },
  { key: "notifications", label: "Notifications", icon: Megaphone, href: "/studentview/notifications" },
  { key: "announcements", label: "Announcements", icon: Megaphone, href: "/studentview/announcements" },
  { key: "requests", label: "My Requests", icon: FileText, href: "/studentview/requests" },
  { key: "schedules", label: "Schedules", icon: Building2, href: "/studentview/schedules" },
  { key: "documents", label: "My Documents", icon: FileText, href: "/studentview/documents" },
  { key: "offices", label: "Offices", icon: Building2, href: "/studentview/offices" }, 
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
  { key: "logout", label: "Logout", icon: LogOut, href: "/" },
];

const OFFICE_LINKS = [
  { key: "registrar", label: "Registrar", icon: FileSignature, href: "/studentview/offices/registrar" },
  { key: "infirmary", label: "Infirmary", icon: PlusSquare, href: "/studentview/offices/infirmary" },
  { key: "scholarship", label: "Scholarship", icon: GraduationCap, href: "/studentview/offices/scholarship" },
  { key: "lsc", label: "Local Student Council", icon: UsersRound, href: "/studentview/offices/local-student-council" },
];

// Admins manage students — requests, announcements, student list
const ADMIN_LINKS: NavLink[] = [
  { key: "admin", label: "Dashboard", icon: Shield, href: "/admin" },
  { key: "students", label: "Manage Students", icon: Users, href: "/admin/students" },
  { key: "requests", label: "Manage Requests", icon: FileText, href: "/requests" },
  { key: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
  { key: "logout", label: "Logout", icon: LogOut, href: "/" },
];

// Superadmin gets everything admins get, plus the ability to create admins
const SUPERADMIN_LINKS: NavLink[] = [
  { key: "admin", label: "Dashboard", icon: Shield, href: "/admin" },
  { key: "create-admin", label: "Create Admin", icon: UserPlus, href: "/admin/create-admin" },
  { key: "students", label: "Manage Students", icon: Users, href: "/admin/students" },
  { key: "requests", label: "Manage Requests", icon: FileText, href: "/requests" },
  { key: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
  { key: "logout", label: "Logout", icon: LogOut, href: "/" },
];

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80";

interface SidebarProps {
  open: boolean;
  role: Role;
}

const Sidebar = ({ open, role }: SidebarProps) => {
  const [officesOpen, setOfficesOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { studentProfile } = useUserProfile();
  const supabase = createClient();

  const navLinks =
    role === "superadmin" ? SUPERADMIN_LINKS : role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;

    const mainLinks = navLinks.filter((link) => link.key !== "logout");

    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push("/");
    };

  return (
    <aside
      className={`relative flex-col shrink-0 shadow-2xl z-10 flex overflow-hidden transition-all duration-300 ease-in-out ${
        open ? "w-[280px]" : "w-0"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")',
        }}
      />
      <div className="absolute inset-0 bg-[#352542]/90 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[#422e51]/80" />

      <nav className="relative z-10 flex-1 flex flex-col pt-4 w-[280px]">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          // Special case: Offices gets a chevron + expandable submenu instead of a plain button
          if (link.key === "offices") {
            return (
              <div key={link.key}>
                <button
                  type="button"
                  onClick={() => setOfficesOpen((prev) => !prev)}
                  className="flex items-center justify-between gap-4 px-6 py-4 w-full text-left transition-all border-b border-white/5 bg-[#402e4d]/50 text-white hover:bg-[#4d375c]"
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5 text-pink-200/70" />
                    <span className="text-sm tracking-wide">{link.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-pink-200/70 transition-transform duration-200 ${
                      officesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {officesOpen && (
                  <div className="flex flex-col">
                    {OFFICE_LINKS.map((office) => {
                      const OfficeIcon = office.icon;
                      const isOfficeActive = pathname === office.href;
                      return (
                        <button
                          key={office.key}
                          type="button"
                          onClick={() => router.push(office.href)}
                          className={`flex items-center gap-4 pl-12 pr-6 py-3 w-full text-left transition-all border-b border-white/5 ${
                            isOfficeActive
                              ? "bg-[#5b4369] text-white font-bold"
                              : "bg-[#352542]/50 text-white hover:bg-[#4d375c]"
                          }`}
                        >
                          <OfficeIcon className={`w-4 h-4 ${isOfficeActive ? "text-pink-300" : "text-pink-200/60"}`} />
                          <span className="text-sm tracking-wide">{office.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Everything else renders as a normal button, unchanged
          return (
            <button
              key={link.key}
              type="button"
              onClick={() => router.push(link.href)}
              className={`flex items-center gap-4 px-6 py-4 w-full text-left transition-all border-b border-white/5 ${
                isActive
                  ? "bg-[#5b4369] text-white font-bold"
                  : "bg-[#402e4d]/50 text-white hover:bg-[#4d375c]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-pink-300" : "text-pink-200/70"}`} />
              <span className="text-sm tracking-wide">{link.label}</span>
            </button>
          );
        })}
      </nav>

      <button
      type="button"
      onClick={handleLogout}
      className="relative z-10 flex items-center gap-4 px-6 py-4 w-[280px] text-left transition-all border-t border-white/10 bg-[#402e4d]/50 text-white hover:bg-[#4d375c]"
    >
      <LogOut className="w-5 h-5 text-pink-200/70" />
      <span className="text-sm tracking-wide">Log out</span>
    </button>

      {/* Bottom Profile Section — reads live from context */}
      <div className="relative z-10 bg-[#886991]/90 backdrop-blur-sm p-4 flex items-center gap-3 w-[280px]">
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-white shadow-sm shrink-0">
          <img
            src={studentProfile?.avatar_url || DEFAULT_AVATAR}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-bold text-white truncate">
            {studentProfile?.full_name ?? "Loading..."}
          </span>
          {studentProfile?.program && studentProfile?.year_section && (
            <span className="text-[11px] text-gray-200 font-medium tracking-wider">
              {studentProfile.program} - {studentProfile.year_section}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
