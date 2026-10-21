"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { StudentProfile } from "@/contexts/UserProfileContext";

// Matches public.profiles for admins
export interface AdminHeaderProfile {
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null; // 'admin' | 'superadmin'
  office?: string | null; // 'registrar' | 'infirmary' | 'lsc' | 'scholarship' | null
}

interface TopHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  studentProfile?: StudentProfile | null;
  variant?: "student" | "admin"; // defaults to "student"
  adminProfile?: AdminHeaderProfile | null; // only used when variant="admin"
}

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80";

const OFFICE_LABELS: Record<string, string> = {
  registrar: "Registrar",
  infirmary: "Infirmary",
  lsc: "LSC",
  scholarship: "Scholarship",
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const TopHeader = ({
  sidebarOpen,
  onToggleSidebar,
  studentProfile,
  variant = "student",
  adminProfile,
}: TopHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const isAdmin = variant === "admin";

  // The search text lives in the URL (?q=...), so the page you're on can filter by it.
  // Going to another page drops it, so the box is re-synced from the URL on every route change.
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [pathname]);

  const runSearch = (value: string) => {
    const q = value.trim();
    const params = new URLSearchParams(window.location.search);
    if (q) params.set("q", q);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  // e.g. "BSCPE-3B". Empty string if the profile is not loaded or both fields are null.
  const programSection = studentProfile
    ? [studentProfile.program, studentProfile.year_section].filter(Boolean).join("-")
    : "";

  // e.g. ["Admin", "Registrar"] or ["Superadmin"]
  const adminLabels = [
    adminProfile?.role ? capitalize(adminProfile.role) : null,
    adminProfile?.office
      ? OFFICE_LABELS[adminProfile.office] ?? capitalize(adminProfile.office)
      : null,
  ].filter(Boolean) as string[];

  const avatarSrc = isAdmin
    ? adminProfile?.avatar_url || DEFAULT_AVATAR
    : studentProfile?.avatar_url || DEFAULT_AVATAR;

  // Shared styling for the three hamburger bars (absolutely positioned in a 60x50 button).
  const barBase =
    "absolute left-[10px] block w-[40px] h-[6px] rounded-[10px] bg-[#443760] " +
    "shadow-[0px_3px_4px_0px_rgba(68,55,96,0.67)] " +
    "transition-all duration-300 ease-in-out motion-reduce:transition-none";

  return (
    <header
      className="
      bg-[linear-gradient(90deg,#b477a1_0%,#996589_33.33%,#8578b0_66.67%,#473350_100%)] 
      h-16 text-white 
      flex items-center 
      px-4 justify-between 
      shrink-0 shadow-md 
      z-20 relative
      "
    >
      {/* Left side: Hamburger & Logo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          className="relative w-[60px] h-[50px] cursor-pointer"
        >
          <span
            className={`${barBase} top-[10px] ${
              sidebarOpen ? "translate-y-[12px] rotate-45" : ""
            }`}
          />
          <span
            className={`${barBase} top-[22px] ${sidebarOpen ? "scale-x-0 opacity-0" : ""}`}
          />
          <span
            className={`${barBase} top-[34px] ${
              sidebarOpen ? "-translate-y-[12px] -rotate-45" : ""
            }`}
          />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src="/mns-logo.png"
              alt="Bulacan State University Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className={`flex flex-col hidden sm:flex ${
              isAdmin ? "font-['Times_New_Roman']" : ""
            }`}
          >
            <span
              className={`text-[13px] font-bold leading-none text-white uppercase drop-shadow-sm ${
                isAdmin ? "tracking-wide" : "tracking-wider"
              }`}
            >
              Bulacan State University
            </span>
            <span
              className={`text-[10px] uppercase mt-0.5 font-medium ${
                isAdmin ? "tracking-wider text-white" : "tracking-widest text-gray-200"
              }`}
            >
              Meneses Campus
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar (filters the page you're on) */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="flex-1 w-[20vw] max-w-[600px] hidden md:block mx-8"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value === "") runSearch(""); // clearing the box clears the filter
            }}
            aria-label="Search this page"
            className="w-full bg-[#493556] shadow-[5px_5px_0px_0px_rgba(68,55,96,0.67),10px_10px_4px_0px_rgba(0,0,0,0.25)] rounded-[10px] py-1.5 pl-5 pr-16 text-sm text-white placeholder-[#9a7b9c] focus:outline-none focus:ring-1 focus:ring-[#B477A1] transition-all"
            placeholder={isAdmin ? "" : "Search this page..."}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                runSearch("");
              }}
              className="absolute right-10 flex items-center justify-center w-6 h-6 bg-transparent border-none hover:cursor-pointer"
            >
              <X className="w-4 h-4 text-[#9a7b9c]" />
            </button>
          )}
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-2 flex items-center justify-center w-8 h-8 bg-transparent border-none hover:cursor-pointer"
          >
            <Search className="w-6 h-6 text-[#9a7b9c]" />
          </button>
        </div>
      </form>

      {/* Right side: User Info & Avatar */}
      <div className="flex items-center gap-3 shrink-0 mr-[5%]">
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-gray-200 cursor-pointer shadow-md shrink-0">
          <img src={avatarSrc} alt="User Avatar" className="w-full h-full object-cover" />
        </div>

        {isAdmin ? (
          // ADMIN: name over "Admin | Registrar"
          <div className="hidden lg:flex flex-col items-start leading-tight drop-shadow-md font-['Times_New_Roman']">
            <span className="text-base font-bold text-white tracking-wide whitespace-nowrap">
              {adminProfile?.full_name ?? "Loading..."}
            </span>
            <span className="text-xs text-white whitespace-nowrap flex items-center">
              {adminLabels.map((label, i) => (
                <span key={label} className="flex items-center">
                  {i > 0 && <span className="mx-3">|</span>}
                  {label}
                </span>
              ))}
            </span>
          </div>
        ) : (
          // STUDENT: unchanged
          <div className="hidden lg:flex flex-col items-start leading-none drop-shadow-md">
            <span className="text-xl font-['Times_New_Roman'] text-white tracking-wide whitespace-nowrap">
              {studentProfile?.full_name ?? "Loading..."}
            </span>
            <span className="text-xl font-['Times_New_Roman'] font-black text-white tracking-widest uppercase whitespace-nowrap">
              {programSection}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopHeader;