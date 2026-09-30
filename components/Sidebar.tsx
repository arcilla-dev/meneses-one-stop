import {
  LogOut,
  User,
  Megaphone,
  FileText,
  Building2,
  Home,
} from 'lucide-react';

const NAV_LINKS = [
  { key: 'home', label: 'Home', icon: Home, href: '#' },
  { key: 'offices', label: 'Offices', icon: Building2, href: '#' },
  { key: 'requests', label: 'My Requests', icon: FileText, href: '#' },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, href: '#' },
  { key: 'profile', label: 'Profile', icon: User, href: '#' },
  { key: 'logout', label: 'Logout', icon: LogOut, href: '#' },
];

const Sidebar = ({
  open,
  activeLink,
  onSelectLink,
}: {
  open: boolean;
  activeLink: string;
  onSelectLink: (link: string) => void;
}) => {
  return (
    <aside
      className={`relative flex-col shrink-0 shadow-2xl z-10 flex overflow-hidden transition-all duration-300 ease-in-out ${
        open ? 'w-[280px]' : 'w-0'
      }`}
    >
      {/* Background Image overlay for sidebar */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")',
        }}
      />
      <div className="absolute inset-0 bg-[#352542]/90 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[#422e51]/80" />

      {/* Navigation Links */}
      <nav className="relative z-10 flex-1 flex flex-col pt-4 w-[280px]">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = activeLink === link.key;
          return (
            <button
              key={link.key}
              type="button"
              onClick={() => onSelectLink(link.key)}
              className={`flex items-center gap-4 px-6 py-4 w-full text-left transition-all border-b border-white/5 ${
                isActive
                  ? 'bg-[#5b4369] text-white font-bold'
                  : 'bg-[#402e4d]/50 text-white hover:bg-[#4d375c]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-pink-300' : 'text-pink-200/70'}`} />
              <span className="text-sm tracking-wide">{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile Section */}
      <div className="relative z-10 bg-[#886991]/90 backdrop-blur-sm p-4 flex items-center gap-3 w-[280px]">
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-white shadow-sm shrink-0">
          <img
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-bold text-white truncate">DELA CRUZ, Juan M.</span>
          <span className="text-[11px] text-gray-200 font-medium tracking-wider">BSCSpe - 4B</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;