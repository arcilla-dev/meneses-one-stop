"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LogOut,
  User,
  Megaphone,
  FileText,
  Building2,
  Bell,
  Home,
  Shield,
  UserPlus,
  Users,
  FileSignature, 
  PlusSquare, 
  GraduationCap, 
  UsersRound,
  CalendarDays,
  BookOpen,
  Printer,
  BookOpenText,
  Settings,
  Phone,
  HandHelping,
  FileSearchCorner,
  FilePenLine,
  Hospital,
  HandCoins,
  UserRoundGroup,
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
  { key: "notifications", label: "Notifications", icon: Bell, href: "/studentview/notifications" },
  { key: "announcements", label: "Announcements", icon: Megaphone, href: "/studentview/announcements" },
  { key: "requests", label: "My Requests", icon: FileText, href: "/studentview/requests" },
  { key: "schedules", label: "Schedules", icon: CalendarDays, href: "/studentview/schedules" },
  { key: "documents", label: "My Documents", icon: BookOpen, href: "/studentview/documents" },
  { key: "offices", label: "Offices", icon: Building2, href: "/studentview/offices" },
  { key: "profile", label: "Profile and Settings", icon: Settings, href: "/studentview/profile-and-settings" },
  { key: "logout", label: "Logout", icon: LogOut, href: "/" },
];

const OFFICE_LINKS = [
  { key: "registrar", label: "Registrar", icon: FileSignature, href: "/studentview/offices/registrar" },
  { key: "infirmary", label: "Infirmary", icon: PlusSquare, href: "/studentview/offices/infirmary" },
  { key: "scholarship", label: "Scholarship", icon: GraduationCap, href: "/studentview/offices/scholarship" },
  { key: "localstudentcouncil", label: "Local Student Council", icon: UsersRound, href: "/studentview/offices/localstudentcouncil" },
];

// Admins manage students — requests, announcements, student list
const ADMIN_LINKS: NavLink[] = [
  { key: "admin", label: "Home", icon: Home, href: "/adminv2" },
  { key: "notifications", label: "Notifications", icon: Bell, href: "/adminv2/notifications" },
  { key: "announcements", label: "Announcements", icon: Megaphone, href: "/adminv2/announcements" },
  { key: "registrar", label: "Registrar", icon: Printer, href: "/adminv2/registrar" },
  { key: "infirmary", label: "Infirmary", icon: Hospital, href: "/adminv2/infirmary" },
  { key: "scholarship", label: "Scholarship", icon: HandCoins, href: "/adminv2/scholarship" },
  { key: "lsc", label: "LSC", icon: UserRoundGroup, href: "/adminv2/lsc" },
  { key: "profile-and-settings", label: "Profile and Setting", icon: Settings, href: "/adminv2/profile-and-settings" },
  { key: "logout", label: "Logout", icon: LogOut, href: "/" },
];

const REGISTRAR_LINKS: NavLink[] = [
  { key: "document-requests", label: "Document Requests", icon: FileText, href: "/adminv2/registrar/document-requests" },
  { key: "add-remove-subjects", label: "Add/Remove Subjects", icon: BookOpenText, href: "/adminv2/registrar/add-remove-subjects" },
];

const INFIRMARY_LINKS: NavLink[] = [
  { key: "appointment-requests", label: "Appointment Requests", icon: Phone, href: "/adminv2/infirmary/appointment-requests" },
  { key: "appointments", label: "Appointments", icon: CalendarDays, href: "/adminv2/infirmary/appointments" },
  { key: "services", label: "Services", icon: HandHelping, href: "/adminv2/infirmary/services" },
];

const SCHOLARSHIP_LINKS: NavLink[] = [
  { key: "scholarship-applications", label: "Scholarship Application", icon: FileSearchCorner, href: "/adminv2/scholarship/scholarship-applications" },
  { key: "scholarship-programs", label: "Scholarship Programs", icon: FilePenLine, href: "/adminv2/scholarship/scholarship-programs" },
];

const LSC_LINKS: NavLink[] = [
  { key: "lsc-service-requests", label: "Service Requests", icon: Phone, href: "/adminv2/lsc/lsc-service-requests" },
  { key: "lsc-services", label: "Services", icon: HandHelping, href: "/adminv2/lsc/lsc-services" },
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
  const router = useRouter();
  const pathname = usePathname();
  const isOfficeRoute = OFFICE_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  const isRegistrarRoute = REGISTRAR_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  const isInfirmaryRoute = INFIRMARY_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  const isScholarshipRoute = SCHOLARSHIP_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  const isLSCRoute = LSC_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  const [officesOpen, setOfficesOpen] = useState(isOfficeRoute);
  const [registrarOpen, setRegistrarOpen] = useState(isRegistrarRoute);
  const [infirmaryOpen, setInfirmaryOpen] = useState(isInfirmaryRoute);
  const [scholarshipOpen, setScholarshipOpen] = useState(isScholarshipRoute);
  const [lscOpen, setLSCOpen] = useState(isLSCRoute);

  const { studentProfile } = useUserProfile();
  const supabase = createClient();

  const navLinks =
    role === "superadmin" ? SUPERADMIN_LINKS 
      : role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;

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

          // Registrar submenu
if (link.key === "registrar") {
  return (
    <div key={link.key}>
      <button
        type="button"
        onClick={() => setRegistrarOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-4 px-6 py-4 w-full text-left transition-all border-b border-white/5 ${
          isRegistrarRoute
            ? "bg-[#5b4369] text-white font-bold"
            : "bg-[#402e4d]/50 text-white hover:bg-[#4d375c]"
        }`}
      >
        <div className="flex items-center gap-4">
          <Icon className="w-5 h-5 text-pink-200/70" />
          <span className="text-sm tracking-wide">{link.label}</span>
        </div>
      </button>

      {(registrarOpen || isRegistrarRoute) && (
        <div className="flex flex-col">
          {REGISTRAR_LINKS.map((item) => {
            const ItemIcon = item.icon;
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-4 pl-12 pr-6 py-3 w-full text-left transition-all border-b border-white/5 ${
                  active
                    ? "bg-[#5b4369] text-white font-bold"
                    : "bg-[#352542]/50 text-white hover:bg-[#4d375c]"
                }`}
              >
                <ItemIcon
                  className={`w-4 h-4 ${
                    active ? "text-pink-300" : "text-pink-200/60"
                  }`}
                />
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

          // Infirmary submenu
          if (link.key === "infirmary") {
            return (
              <div key={link.key}>
                <button
                  type="button"
                  onClick={() => setInfirmaryOpen((prev) => !prev)}
                  className={`flex items-center justify-between gap-4 px-6 py-4 w-full text-left transition-all border-b border-white/5 ${
                    isInfirmaryRoute
                      ? "bg-[#5b4369] text-white font-bold"
                      : "bg-[#402e4d]/50 text-white hover:bg-[#4d375c]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5 text-pink-200/70" />
                    <span className="text-sm tracking-wide">{link.label}</span>
                  </div>
                </button>

                {(infirmaryOpen || isInfirmaryRoute) && (
                  <div className="flex flex-col">
                    {INFIRMARY_LINKS.map((item) => {
                      const ItemIcon = item.icon;
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`flex items-center gap-4 pl-12 pr-6 py-3 w-full text-left transition-all border-b border-white/5 ${
                            active
                              ? "bg-[#5b4369] text-white font-bold"
                              : "bg-[#352542]/50 text-white hover:bg-[#4d375c]"
                          }`}
                        >
                          <ItemIcon
                            className={`w-4 h-4 ${
                              active ? "text-pink-300" : "text-pink-200/60"
                            }`}
                          />
                          <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Scholarship submenu
          if (link.key === "scholarship") {
            return (
              <div key={link.key}>
                <button
                  type="button"
                  onClick={() => setScholarshipOpen((prev) => !prev)}
                  className={`flex items-center justify-between gap-4 px-6 py-4 w-full text-left transition-all border-b border-white/5 ${
                    isScholarshipRoute
                      ? "bg-[#5b4369] text-white font-bold"
                      : "bg-[#402e4d]/50 text-white hover:bg-[#4d375c]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5 text-pink-200/70" />
                    <span className="text-sm tracking-wide">{link.label}</span>
                  </div>
                </button>

                {(scholarshipOpen || isScholarshipRoute) && (
                  <div className="flex flex-col">
                    {SCHOLARSHIP_LINKS.map((item) => {
                      const ItemIcon = item.icon;
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`flex items-center gap-4 pl-12 pr-6 py-3 w-full text-left transition-all border-b border-white/5 ${
                            active
                              ? "bg-[#5b4369] text-white font-bold"
                              : "bg-[#352542]/50 text-white hover:bg-[#4d375c]"
                          }`}
                        >
                          <ItemIcon
                            className={`w-4 h-4 ${
                              active ? "text-pink-300" : "text-pink-200/60"
                            }`}
                          />
                          <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // LSC submenu
          if (link.key === "lsc") {
            return (
              <div key={link.key}>
                <button
                  type="button"
                  onClick={() => setLSCOpen((prev) => !prev)}
                  className={`flex items-center justify-between gap-4 px-6 py-4 w-full text-left transition-all border-b border-white/5 ${
                    isLSCRoute
                      ? "bg-[#5b4369] text-white font-bold"
                      : "bg-[#402e4d]/50 text-white hover:bg-[#4d375c]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5 text-pink-200/70" />
                    <span className="text-sm tracking-wide">{link.label}</span>
                  </div>
                </button>

                {(lscOpen || isLSCRoute) && (
                  <div className="flex flex-col">
                    {LSC_LINKS.map((item) => {
                      const ItemIcon = item.icon;
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`flex items-center gap-4 pl-12 pr-6 py-3 w-full text-left transition-all border-b border-white/5 ${
                            active
                              ? "bg-[#5b4369] text-white font-bold"
                              : "bg-[#352542]/50 text-white hover:bg-[#4d375c]"
                          }`}
                        >
                          <ItemIcon
                            className={`w-4 h-4 ${
                              active ? "text-pink-300" : "text-pink-200/60"
                            }`}
                          />
                          <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Offices submenu
          if (link.key === "offices") {
            return (
              <div key={link.key}>
                <button
                  type="button"
                  onClick={() => setOfficesOpen((prev) => !prev)}
                  className={`flex items-center justify-between gap-4 px-6 py-4 w-full text-left transition-all border-b border-white/5 ${
                    isOfficeRoute
                      ? "bg-[#5b4369] text-white font-bold"
                      : "bg-[#402e4d]/50 text-white hover:bg-[#4d375c]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5 text-pink-200/70" />
                    <span className="text-sm tracking-wide">{link.label}</span>
                  </div>
                </button>

                {(officesOpen || isOfficeRoute) && (
                  <div className="flex flex-col">
                    {OFFICE_LINKS.map((item) => {
                      const ItemIcon = item.icon;
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`flex items-center gap-4 pl-12 pr-6 py-3 w-full text-left transition-all border-b border-white/5 ${
                            active
                              ? "bg-[#5b4369] text-white font-bold"
                              : "bg-[#352542]/50 text-white hover:bg-[#4d375c]"
                          }`}
                        >
                          <ItemIcon
                            className={`w-4 h-4 ${
                              active ? "text-pink-300" : "text-pink-200/60"
                            }`}
                          />
                          <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
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
