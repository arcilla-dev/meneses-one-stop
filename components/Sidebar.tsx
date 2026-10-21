"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ChevronDown } from "lucide-react";
import { Dela_Gothic_One, Great_Vibes } from "next/font/google";
import type { Role } from "@/contexts/UserProfileContext";
import type { Office } from "@/lib/adminHome";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

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
  home: "/icons/home-icon.png",
  notifications: "/icons/notification-icon.png",
  announcements: "/icons/announcement-icon.png",
  requests: "/icons/request-icon.png",
  schedules: "/icons/schedule-icon.png",
  documents: "/icons/documents-icon.png",
  offices: "/icons/offices-icon.png",
  profile: "/icons/settings-icon.png",
  logout: "/icons/logout-icon.png",
  // Admin links (same images as the student equivalents)
  admin: "/icons/home-icon.png",
  "profile-and-settings": "/icons/settings-icon.png",
  // TODO add images (placeholder square shows until then):
  // students, "create-admin"
  // Offices submenu / admin office links
  registrar: "/icons/registrar-icon.png",
  infirmary: "/icons/infirmary-icon.png",
  scholarship: "/icons/scholarship-icon.png",
  lsc: "/icons/lsc-icon.png",
  localstudentcouncil: "/icons/lsc-icon.png",
  // dropdown children for admin
  "document-requests": "/icons/request-icon.png",
  "add-remove-subjects": "/icons/add-remove-subject.png",
  "appointment-requests": "/icons/appointment-requests.png",
  appointments: "/icons/appointments.png",
  services: "/icons/services.png",
  "scholarship-applications": "/icons/scholarship-applications.png",
  "scholarship-programs": "/icons/scholarship-programs.png",
  "lsc-service-requests": "/icons/lsc-service-requests.png",
  "lsc-services": "/icons/services.png",
};

// Color of the icons when their row is active
const ACTIVE_ICON_COLOR = "#3b2767";

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
// Small red bubble pinned to the corner of the Notifications icon
const UnreadBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#2e1b3e] bg-[#ff3b3b] px-1 font-sans text-[10px] font-bold leading-none text-white"
      >
        {count > 9 ? "9+" : count}
      </span>
      <span className="sr-only">{count} unread</span>
    </>
  );
};

interface SidebarProps { open: boolean; role: Role; office: Office | null; }

interface NavLink {
  key: string;
  label: string;
  href: string;
}

const STUDENT_LINKS: NavLink[] = [
  { key: "home", label: "Home", href: "/studentview" },
  { key: "notifications", label: "Notifications", href: "/studentview/notifications" },
  { key: "announcements", label: "Announcements", href: "/studentview/announcements" },
  { key: "requests", label: "My Requests", href: "/studentview/requests" },
  { key: "schedules", label: "Schedules", href: "/studentview/schedules" },
  { key: "documents", label: "My Documents", href: "/studentview/documents" },
  { key: "offices", label: "Offices", href: "/studentview/offices" },
  { key: "profile", label: "Profile and Settings", href: "/studentview/profile-and-settings" },
  { key: "logout", label: "Logout", href: "/" },
];

const OFFICE_LINKS: NavLink[] = [
  { key: "registrar", label: "Registrar", href: "/studentview/offices/registrar" },
  { key: "infirmary", label: "Infirmary", href: "/studentview/offices/infirmary" },
  { key: "scholarship", label: "Scholarship", href: "/studentview/offices/scholarship" },
  { key: "localstudentcouncil", label: "Local Student Council", href: "/studentview/offices/localstudentcouncil" },
];

// Admins manage students — requests, announcements, student list
const ADMIN_LINKS: NavLink[] = [
  { key: "admin", label: "Home", href: "/adminv2" },
  { key: "notifications", label: "Notifications", href: "/adminv2/notifications" },
  { key: "announcements", label: "Announcements", href: "/adminv2/announcements" },
  { key: "registrar", label: "Registrar", href: "/adminv2/registrar" },
  { key: "infirmary", label: "Infirmary", href: "/adminv2/infirmary" },
  { key: "scholarship", label: "Scholarship", href: "/adminv2/scholarship" },
  { key: "lsc", label: "LSC", href: "/adminv2/lsc" },
  { key: "profile-and-settings", label: "Profile and Setting", href: "/adminv2/profile-and-settings" },
  { key: "logout", label: "Logout", href: "/" },
];

const REGISTRAR_LINKS: NavLink[] = [
  { key: "document-requests", label: "Document Requests", href: "/adminv2/registrar/document-requests" },
  { key: "add-remove-subjects", label: "Add/Remove Subjects", href: "/adminv2/registrar/add-remove-subjects" },
  { key: "documents", label: "Documents Record", href: "/adminv2/registrar/documents" },
];

const INFIRMARY_LINKS: NavLink[] = [
  { key: "appointment-requests", label: "Appointment Requests", href: "/adminv2/infirmary/appointment-requests" },
  { key: "appointments", label: "Appointments", href: "/adminv2/infirmary/appointments" },
  { key: "services", label: "Services", href: "/adminv2/infirmary/services" },
];

const SCHOLARSHIP_LINKS: NavLink[] = [
  { key: "scholarship-applications", label: "Scholarship Application", href: "/adminv2/scholarship/scholarship-applications" },
  { key: "scholarship-programs", label: "Scholarship Programs", href: "/adminv2/scholarship/scholarship-programs" },
];

const LSC_LINKS: NavLink[] = [
  { key: "lsc-service-requests", label: "Service Requests", href: "/adminv2/lsc/lsc-service-requests" },
  { key: "lsc-services", label: "Services", href: "/adminv2/lsc/lsc-services" },
];

// Superadmin gets everything admins get, plus the ability to create admins
const SUPERADMIN_LINKS: NavLink[] = [
  ...ADMIN_LINKS.filter((l) => l.key !== "profile-and-settings" && l.key !== "logout"),
  { key: "create-admin", label: "Admin Creation", href: "/admin/create-admin" },
  ...ADMIN_LINKS.filter((l) => l.key === "profile-and-settings" || l.key === "logout"),
];

// Collapsible groups, keyed by the parent link's key
const GROUPS: Record<string, NavLink[]> = {
  offices: OFFICE_LINKS,
  registrar: REGISTRAR_LINKS,
  infirmary: INFIRMARY_LINKS,
  scholarship: SCHOLARSHIP_LINKS,
  lsc: LSC_LINKS,
};

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

const isUnder = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const anyUnder = (pathname: string, links: NavLink[]) =>
  links.some(({ href }) => isUnder(pathname, href));

const Sidebar = ({ open, role, office  }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const OFFICE_KEYS = ["registrar", "infirmary", "scholarship", "lsc"];
  const unread = useUnreadNotifications(role);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      Object.entries(GROUPS).map(([key, links]) => [key, anyUnder(pathname, links)])
    )
  );
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Auto-open a group only when navigation lands inside it.
  // A manual collapse on the current page is respected because pathname does not change.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const [key, links] of Object.entries(GROUPS)) {
        if (anyUnder(pathname, links)) next[key] = true;
      }
      return next;
    });
  }, [pathname]);

  // Close the confirmation with the Escape key
  useEffect(() => {
    if (!confirmLogout) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmLogout(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmLogout]);

  // Confirmed logout: actually end the Supabase session, then leave
  const handleConfirmLogout = async () => {
    setConfirmLogout(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  // Every collapsible group in one place, keyed by the parent link's key
  const submenus = Object.fromEntries(
    Object.entries(GROUPS).map(([key, items]) => [
      key,
      {
        items,
        isRoute: anyUnder(pathname, items),
        open: !!openGroups[key],
        toggle: () => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] })),
      },
    ])
  ) as Record<
    string,
    { items: NavLink[]; isRoute: boolean; open: boolean; toggle: () => void }
  >;

  const navLinks =
  role === "superadmin"
    ? SUPERADMIN_LINKS
    : role === "admin"
      ? ADMIN_LINKS.filter((l) => !OFFICE_KEYS.includes(l.key) || l.key === office)
      : STUDENT_LINKS;

  return (
    <aside
      className={`relative flex flex-col shrink-0 shadow-2xl z-10 overflow-hidden transition-all duration-300 ease-in-out ${
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

      <nav className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-[10px] pt-4 pb-4 w-[280px] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.3)_transparent]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const submenu = submenus[link.key];

          // Collapsible groups (Offices, Registrar, Infirmary, Scholarship, LSC)
          if (submenu) {
            const expanded = submenu.open;

            return (
              <div key={link.key} className="flex flex-col gap-[3px]">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={submenu.toggle}
                  className={`${ROW_BASE} justify-between ${
                    submenu.isRoute ? ROW_ACTIVE : ROW_NORMAL
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <NavIcon iconKey={link.key} active={submenu.isRoute} />
                    <span className="tracking-wide">{link.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      submenu.isRoute ? "text-[#3b2767]" : "text-[#C48AB2]"
                    } ${expanded ? "rotate-180" : ""}`}
                  />
                </button>

                {expanded && (
                  <div className="flex flex-col gap-[3px]">
                    {submenu.items.map((item) => {
                      const itemActive = isUnder(pathname, item.href);

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`flex items-center gap-4 pl-12 pr-6 py-3 w-full text-left transition-all font-['Times_New_Roman'] font-bold text-[15px] text-white ${
                            itemActive ? ROW_ACTIVE : "bg-[#2e1b3e]/85 hover:brightness-125"
                          }`}
                        >
                          <NavIcon iconKey={item.key} active={itemActive} size={22} />
                          <span className="tracking-wide">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Everything else renders as a normal button
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
              <span className="relative shrink-0">
                <NavIcon iconKey={link.key} active={isActive} />
                {link.key === "notifications" && <UnreadBadge count={unread} />}
              </span>
              <span className="tracking-wide">{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom branding on pink background */}
      <div className="relative z-10 shrink-0 w-[280px] bg-[linear-gradient(180deg,#B98AB6_0%,#C99BC4_100%)] px-4 py-3 text-center text-white shadow-[0_-6px_12px_rgba(0,0,0,0.25)]">
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
