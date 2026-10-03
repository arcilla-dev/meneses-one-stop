'use client';

import { Search } from 'lucide-react';

export interface StudentProfile {
  full_name: string;
  program: string | null;
  year_section: string | null;
}

interface TopHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  studentProfile?: StudentProfile | null;
}

const TopHeader = ({ sidebarOpen, onToggleSidebar, studentProfile }: TopHeaderProps) => {
  // e.g. "BSIT-3A". Empty string if the profile is not loaded or both fields are null.
  const programSection = studentProfile
    ? [studentProfile.program, studentProfile.year_section].filter(Boolean).join('-')
    : '';

  // Shared styling for the three hamburger bars (absolutely positioned in a 60x50 button).
  const barBase =
    "absolute left-[10px] block w-[40px] h-[6px] rounded-[10px] bg-[#443760] " +
    "shadow-[0px_3px_4px_0px_rgba(68,55,96,0.67)] " +
    "transition-all duration-300 ease-in-out motion-reduce:transition-none";

  return (
    <header className="
      bg-[linear-gradient(90deg,#b477a1_0%,#996589_33.33%,#8578b0_66.67%,#473350_100%)] 
      h-16 text-white 
      flex items-center 
      px-4 justify-between 
      shrink-0 shadow-md 
      z-20 relative
      ">
      {/* Left side: Hamburger & Logo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          className="relative w-[60px] h-[50px] cursor-pointer"
        >
          {/* Hamburger <-> X. Bars are 6px tall, centers 12px apart, so the outer
              bars travel 12px to meet the middle bar's position before rotating. */}
          <span
            className={`${barBase} top-[10px] ${
              sidebarOpen ? "translate-y-[12px] rotate-45" : ""
            }`}
          />
          <span
            className={`${barBase} top-[22px] ${
              sidebarOpen ? "scale-x-0 opacity-0" : ""
            }`}
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
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[13px] font-bold tracking-wider leading-none text-white uppercase drop-shadow-sm">
              Bulacan State University
            </span>
            <span className="text-[10px] tracking-widest text-gray-200 uppercase mt-0.5 font-medium">
              Meneses Campus
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 w-[20vw] max-w-[600px] hidden md:block mx-8">
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full bg-[#493556] shadow-[5px_5px_0px_0px_rgba(68,55,96,0.67),10px_10px_4px_0px_rgba(0,0,0,0.25)] rounded-[10px] py-1.5 px-5 text-sm text-white placeholder-transparent focus:outline-none focus:ring-1 focus:ring-[#B477A1] transition-all"
            placeholder="Search..."
          />
          <button
            type="button"
            aria-label="Search"
            className="absolute right-2 flex items-center justify-center w-8 h-8 bg-transparent border-none hover:cursor-pointer"
          >
            <Search className="w-6 h-6 text-[#9a7b9c]" />
          </button>
        </div>
      </div>

     
      {/* Right side: User Info & Avatar */}
      <div className="flex items-center gap-3 shrink-0 mr-[5%]">

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-gray-200 cursor-pointer shadow-md shrink-0">
          <img
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name + Program/Section */}
        <div className="hidden lg:flex flex-col items-start leading-none drop-shadow-md">
          <span className="text-xl font-['Times_New_Roman'] text-white tracking-wide whitespace-nowrap">
            {studentProfile?.full_name}
          </span>

          <span className="text-xl font-['Times_New_Roman'] font-black text-white tracking-widest uppercase whitespace-nowrap">
            {programSection}
          </span>
        </div>

      </div>


    </header>
  );
};

export default TopHeader;
