"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
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
import { Dela_Gothic_One, Great_Vibes } from "next/font/google";
import type { Role } from "@/contexts/UserProfileContext";

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

/* ------------------------------------------------------------------ */
/*  PLACEHOLDERS: change these later                                   */
/* ------------------------------------------------------------------ */

// 1) Sidebar background photo. Put your image in /public and change this path.
const SIDEBAR_BG_IMAGE = "/campus-bg.png";

// 2) Icons. Until you add one, a pink placeholder square is shown.
//    Put your icon files in /public/icons and fill in the paths, e.g.
//    home: "/icons/home.png"
const ICON_SRC: Partial<Record<string, string>> = {
  // Main links
  home: '/icons/home-icon.png',
  notifications: '/icons/notification-icon.png',
  announcements: '/icons/announcement-icon.png',
  requests: '/icons/request-icon.png',
  schedules: '/icons/schedule-icon.png',
  documents: '/icons/documents-icon.png',
  offices: '/icons/offices-icon.png',
  profile: '/icons/settings-icon.png',
  logout: '/icons/logout-icon.png',
  // Admin links
  admin: undefined,
  students: undefined,
  "create-admin": undefined,
  // Offices submenu
  registrar: '/icons/registrar-icon.png',
  infirmary: '/icons/infirmary-icon.png',
  scholarship: '/icons/scholarship-icon.png',
  lsc:'/icons/lsc-icon.png',
};

// Color of the icons when their row is active
const ACTIVE_ICON_COLOR = "#443760";

const NavIcon = ({
  iconKey,
  active = false,
  size = 28,
}: {
  iconKey: string;
  active?: boolean;
  size?: number;
}) => {
  const src = ICON_SRC[iconKey];

  if (src) {
    // Active: paint the icon's shape in purple using the PNG as a mask
    if (active) {
      return (
        <div
          aria-hidden="true"
          className="shrink-0"
          style={{
            width: size,
            height: size,
            backgroundColor: ACTIVE_ICON_COLOR,
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      );
    }

    // Not active: your original icon, unchanged
    return (
      <img
        src={src}
        alt=""
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
      />
    );
  }

  // Placeholder square
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-md ${active ? "bg-[#4A3560]" : "bg-[#C48AB2]"}`}
    />
  );
};

/* ------------------------------------------------------------------ */

interface NavLink {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const STUDENT_LINKS: NavLink[] = [
  { key: "home", label: "Home", icon: Home, href: "/studentview" },
  { key: "notifications", label: "Notifications", icon: Megaphone, href: "/notifications" },
  { key: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
  { key: "requests", label: "My Requests", icon: FileText, href: "/requests" },
  { key: "schedules", label: "Schedules", icon: Building2, href: "/schedules" },
  { key: "documents", label: "My Documents", icon: FileText, href: "/documents" },
  { key: "offices", label: "Offices", icon: Building2, href: "/offices" }, // ADD THIS
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
  { key: "logout", label: "Logout", icon: LogOut, href: "/" },
];

const OFFICE_LINKS = [
  { key: "registrar", label: "Registrar", icon: FileSignature, href: "/offices/registrar" },
  { key: "infirmary", label: "Infirmary", icon: PlusSquare, href: "/offices/infirmary" },
  { key: "scholarship", label: "Scholarship", icon: GraduationCap, href: "/offices/scholarship" },
  { key: "lsc", label: "Local Student Council", icon: UsersRound, href: "/offices/local-student-council" },
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

interface SidebarProps {
  open: boolean;
  role: Role;
}

// Look of each row: normal = dark plum with a lighter band on top, active = pink gradient
const ROW_BASE =
  "flex items-center gap-4 px-8 py-3 w-full text-left transition-all " +
  "font-['Times_New_Roman'] font-bold text-[19px] text-white";
const ROW_NORMAL =
  "bg-[linear-gradient(90deg,rgba(68,55,96,0.75)_0%,rgba(68,55,96,0.75)_50%,rgba(43,9,20,0.75)_100%)] hover:brightness-125";
const ROW_ACTIVE =
  "bg-[linear-gradient(135deg,rgba(198,145,189,0.85)_0%,rgba(160,115,165,0.85)_55%,rgba(122,98,160,0.85)_100%)]";

const Sidebar = ({ open, role }: SidebarProps) => {
  const [officesOpen, setOfficesOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Close the confirmation with the Escape key
  useEffect(() => {
    if (!confirmLogout) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmLogout(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmLogout]);

  const handleConfirmLogout = () => {
    setConfirmLogout(false);
    router.push("/"); // same destination the Logout link had before
  };

  const navLinks =
    role === "superadmin" ? SUPERADMIN_LINKS : role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;

  return (
    <aside
      className={`relative flex-col shrink-0 shadow-2xl z-10 flex overflow-hidden transition-all duration-300 ease-in-out ${
        open ? "w-[280px]" : "w-0"
      }`}
    >
      {/* Background photo (placeholder: change SIDEBAR_BG_IMAGE at the top) */}
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url("${SIDEBAR_BG_IMAGE}")`,
          backgroundPosition: "30% center",
        }}
      />
      <div className="absolute inset-0 bg-[#3a2a55]/75" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(120,100,170,0.35)_0%,rgba(60,35,80,0.55)_100%)]" />

      <nav className="relative z-10 flex-1 flex flex-col gap-[10px] pt-4 w-[280px]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          // Special case: Offices gets a chevron + expandable submenu instead of a plain button
          if (link.key === "offices") {
            return (
              <div key={link.key} className="flex flex-col gap-[3px]">
                <button
                  type="button"
                  onClick={() => setOfficesOpen((prev) => !prev)}
                  className={`${ROW_BASE} justify-between ${ROW_NORMAL}`}
                >
                  <div className="flex items-center gap-4">
                    <NavIcon iconKey={link.key} />
                    <span className="tracking-wide">{link.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#C48AB2] transition-transform duration-200 ${
                      officesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {officesOpen && (
                  <div className="flex flex-col gap-[3px]">
                    {OFFICE_LINKS.map((office) => {
                      const isOfficeActive = pathname === office.href;
                      return (
                        <button
                          key={office.key}
                          type="button"
                          onClick={() => router.push(office.href)}
                          className={`flex items-center gap-4 pl-12 pr-6 py-3 w-full text-left transition-all font-['Times_New_Roman'] font-bold text-[15px] text-white ${
                            isOfficeActive ? ROW_ACTIVE : "bg-[#2e1b3e]/85 hover:brightness-125"
                          }`}
                        >
                          <NavIcon iconKey={office.key} active={isOfficeActive} size={22} />
                          <span className="tracking-wide">{office.label}</span>
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
              onClick={() =>
                link.key === "logout" ? setConfirmLogout(true) : router.push(link.href)
              }
              className={`${ROW_BASE} ${isActive ? ROW_ACTIVE : ROW_NORMAL} ${
                link.key === "logout" ? "mt-auto" : ""
              }`}
            >
              <NavIcon iconKey={link.key} active={isActive} />
              <span className="tracking-wide">{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom branding on pink background */}
      <div className="relative z-10 w-[280px] bg-[linear-gradient(180deg,#B98AB6_0%,#C99BC4_100%)] px-4 py-3 text-center text-white shadow-[0_-6px_12px_rgba(0,0,0,0.25)]">
        <div className={`${greatVibes.className} text-[34px] leading-none drop-shadow-md`}>
          Meneses Campus
        </div>
        <div className={`${delaGothicOne.className} text-[28px] leading-none tracking-wide drop-shadow-md`}>
          ONE-STOP
        </div>
      </div>

      {/* Logout confirmation (portal, so it covers the whole screen, not just the sidebar) */}
      {confirmLogout &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setConfirmLogout(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border-[3px] border-[#d9a9c9] bg-[linear-gradient(135deg,#F6DAEF_0%,#E5B8D9_100%)] p-6 text-center shadow-2xl"
            >
              <h2 id="logout-title" className={`${delaGothicOne.className} text-2xl text-[#443760]`}>
                Log out?
              </h2>
              <p className="mt-2 font-['Times_New_Roman'] text-lg text-[#443760]">
                Are you sure you want to log out of your account?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 cursor-pointer rounded-[10px] bg-[#d3bbcc] py-2 font-['Times_New_Roman'] text-lg font-bold text-[#443760] shadow-sm transition hover:brightness-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 cursor-pointer rounded-[10px] bg-[#443760] py-2 font-['Times_New_Roman'] text-lg font-bold text-white shadow-[4px_4px_0px_0px_rgba(68,55,96,0.35)] transition hover:brightness-110"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
};

export default Sidebar;