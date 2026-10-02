'use client';

import { Search } from 'lucide-react';

interface TopHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const TopHeader = ({ sidebarOpen, onToggleSidebar }: TopHeaderProps) => {
  return (
    <header className="h-16 bg-[#70547b] text-white flex items-center px-4 justify-between shrink-0 shadow-md z-20 relative">
      {/* Left side: Hamburger & Logo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          className="w-[42px] h-[36px] bg-[#6666ff] border-[3px] border-[#9b51e0] rounded flex flex-col justify-evenly items-center py-1 cursor-pointer hover:bg-blue-600 active:scale-95 transition-all"
        >
          <div className="w-[28px] h-[4px] bg-[#2a2a2a]" />
          <div className="w-[28px] h-[4px] bg-[#2a2a2a]" />
          <div className="w-[28px] h-[4px] bg-[#2a2a2a]" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-pink-400">
            <img
              src="/images/meneses.jpg"
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
      <div className="flex-1 max-w-lg hidden md:block mx-8">
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full bg-[#493556] rounded py-1.5 px-4 text-sm text-white placeholder-transparent focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all border border-[#3b2a45] shadow-inner"
            placeholder="Search..."
          />
          <Search className="absolute right-3 text-[#9a7b9c] w-5 h-5 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Right side: Branding & Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex flex-col text-right mr-2 leading-none drop-shadow-md">
          <span
            className="text-xl text-white tracking-wide"
            style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive" }}
          >
            Meneses Campus
          </span>
          <span className="text-xl font-black text-white tracking-widest uppercase">
            ONE-STOP
          </span>
        </div>

        <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-gray-200 cursor-pointer shadow-md">
          <img
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;