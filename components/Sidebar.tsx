"use client";

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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const STUDENT_LINKS: NavLink[] = [
  { key: "home", label: "Home", icon: Home, href: "/studentview" },
  { key: "offices", label: "Offices", icon: Building2, href: "/offices" },
  { key: "requests", label: "My Requests", icon: FileText, href: "/requests" },
  { key: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
  { key: "logout", label: "Logout", icon: LogOut, href: "/" },
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
  role: "student" | "admin" | "superadmin" | null;
}

const Sidebar = ({ open, role }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const navLinks =
    role === "superadmin" ? SUPERADMIN_LINKS : role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;

  const handleNavClick = (href: string) => {
    router.push(href);
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
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <button
              key={link.key}
              type="button"
              onClick={() => handleNavClick(link.href)}
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

      <div className="relative z-10 bg-[#886991]/90 backdrop-blur-sm p-4 flex items-center gap-3 w-[280px]">
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-white shadow-sm shrink-0">
          <img
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-bold text-white truncate">
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Loading..."}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;