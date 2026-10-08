'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  GraduationCap,
  Users,
  Settings,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StudentProfile } from '@/contexts/UserProfileContext';

interface MainCenterProps {
  studentProfile?: StudentProfile | null;
}

/* =========================================================
   Shortcut tiles
   ========================================================= */
interface ShortcutTileProps {
  label: string;
  href: string;
  icon: LucideIcon;
  image?: string; // optional background photo, e.g. '/images/registrar.jpg'
}

const ShortcutTile = ({ label, href, icon: Icon, image }: ShortcutTileProps) => (
  <Link
    href={href}
    className="relative flex h-[88px] flex-col items-center justify-end overflow-hidden rounded-lg px-2 pb-2 text-center font-serif text-sm font-bold leading-tight text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:text-base"
    style={{
      backgroundColor: '#5a3d6e',
      backgroundImage: `linear-gradient(rgba(91,74,120,.85), rgba(60,30,50,.88))${image ? `, url(${image})` : ''}`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <span className="absolute left-1/2 top-2.5 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#d9a0c5_70%)]">
      <Icon className="h-5 w-5 text-black" />
    </span>
    {label}
  </Link>
);

const RegistrarTile = () => <ShortcutTile label="Registrar" href="/registrar" icon={FileText} />;
const InfirmaryTile = () => <ShortcutTile label="Infirmary" href="/infirmary" icon={Plus} />;
const ScholarshipTile = () => <ShortcutTile label="Scholarship" href="/scholarship" icon={GraduationCap} />;
const LocalStudentCouncilTile = () => (
  <ShortcutTile label="Local Student Council" href="/lsc" icon={Users} />
);

/* =========================================================
   Latest Announcements (reusable)
   ========================================================= */
export interface AnnouncementData {
  id: number | string;
  title: string;
  date: string;
  href?: string;
}

// One row. Colors alternate automatically (odd = dark rose, even = light rose)
export const AnnouncementItem = ({ title, date, href = '/announcements' }: Omit<AnnouncementData, 'id'>) => (
  <Link
    href={href}
    className="relative flex min-h-[54px] items-center gap-3 px-3 pb-6 pt-2 odd:bg-[#c58bb0] odd:text-white even:bg-[#d9aecb] even:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3d2c66]"
  >
    <Settings className="h-9 w-9 shrink-0 text-[#6d5a8c]" />
    <span className="flex-1 text-base leading-snug">{title}</span>
    <time className="absolute bottom-1 right-2 text-sm font-bold odd:font-bold even:font-normal">{date}</time>
  </Link>
);

interface LatestAnnouncementsProps {
  items: AnnouncementData[];
  title?: string;
}

export const LatestAnnouncements = ({ items, title = 'Latest Announcements' }: LatestAnnouncementsProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <section
      aria-labelledby="latest-announcements-title"
      className="flex-1 rounded-lg bg-gradient-to-br from-[#b98aa6] via-[#f6d3ea] to-[#bf93ad] px-6 pb-4 pt-4 shadow-md"
    >
      <h2
        id="latest-announcements-title"
        className="mb-4 text-center text-xl text-[#3d2c66] md:text-2xl xl:text-3xl"
        style={{ fontFamily: "'Michroma', sans-serif" }}
      >
        {title}
      </h2>

      <div ref={listRef} className="max-h-[216px] overflow-y-auto rounded-md pr-3">
        {items.length === 0 && <p className="py-6 text-center text-[#3d2c66]">No announcements yet.</p>}
        {items.map((a) => (
          <AnnouncementItem key={a.id} title={a.title} date={a.date} href={a.href} />
        ))}
      </div>

      <button
        type="button"
        aria-label="Show more announcements"
        onClick={() => listRef.current?.scrollBy({ top: 108, behavior: 'smooth' })}
        className="mx-auto mt-3 block text-[#5b4a6e] hover:text-[#3d2c66]"
      >
        <ChevronDown className="h-8 w-14" strokeWidth={3} />
      </button>
    </section>
  );
};

/* =========================================================
   Quick Access (reusable)
   ========================================================= */
export interface QuickAccessData {
  id: number | string;
  label?: string; // empty = placeholder line
  href: string;
}

export const QuickAccessItem = ({ label, href }: Omit<QuickAccessData, 'id'>) => (
  <Link
    href={href}
    className="flex min-h-[52px] items-center gap-5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
  >
    <FileText className="h-8 w-8 shrink-0 text-[#d48fb9]" />
    {label ? (
      <span className="font-serif text-xl font-bold">{label}</span>
    ) : (
      <span className="mt-4 h-px flex-1 bg-white" />
    )}
  </Link>
);

interface QuickAccessProps {
  items: QuickAccessData[];
  title?: string;
}

export const QuickAccess = ({ items, title = 'Quick Access' }: QuickAccessProps) => (
  <aside
    aria-labelledby="quick-access-title"
    className="w-full shrink-0 rounded-lg bg-gradient-to-br from-[#62507f] to-[#4e3f68] px-7 pb-6 pt-5 shadow-md xl:w-[300px]"
  >
    <h2 id="quick-access-title" className="mb-4 font-serif text-2xl font-bold text-white">
      {title}
    </h2>
    <div className="flex flex-col gap-2">
      {items.map((f) => (
        <QuickAccessItem key={f.id} label={f.label} href={f.href} />
      ))}
    </div>
  </aside>
);

/* =========================================================
   Data (TODO: replace with data from your API)
   ========================================================= */
const ANNOUNCEMENTS: AnnouncementData[] = [
  { id: 1, title: 'Final examination schedule for the first semester', date: 'Dec 16, 2026' },
  { id: 2, title: 'Enrollment for the second semester opens', date: 'Mar 25, 2026' },
  { id: 3, title: 'Scholarship application deadline extended', date: 'Mar 25, 2026' },
  { id: 4, title: 'Campus clinic hours updated', date: 'Mar 25, 2026' },
  { id: 5, title: 'Student council elections', date: 'Mar 20, 2026' },
];

const QUICK_FILES: QuickAccessData[] = [
  { id: 1, label: 'Recent Files', href: '/my-documents' },
  { id: 2, href: '#' },
  { id: 3, href: '#' },
];

/* =========================================================
   Page section
   ========================================================= */
const MainCenter = ({ studentProfile }: MainCenterProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 bg-[#fcdced]">
      {/* Top row: banner + date/time */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Banner Section */}
        <div className="flex-1 h-[220px] rounded-xl relative overflow-hidden shadow-xl flex flex-col items-center justify-center border-2 border-[#543b59]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1200")',
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent mix-blend-multiply" />

          <div className="relative z-10 text-white text-center w-full px-6 flex flex-col gap-2 drop-shadow-lg">
            <p className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-gray-200">
              Everything you need, in one place.
            </p>

            <h1 className="text-3xl md:text-5xl font-black tracking-wide text-white mt-1">
              GOOD MORNING,{' '}
              <span
                className="font-normal capitalize ml-1 text-pink-100"
                style={{
                  fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
                  fontSize: '1.2em',
                }}
              >
                {studentProfile?.full_name ?? 'Loading...'}
              </span>
            </h1>

            <p className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-gray-300 mt-2">
              Welcome back to your dashboard
            </p>
          </div>
        </div>

        {/* Right Side Widgets */}
        <div className="flex flex-col gap-4 w-full xl:w-[320px] shrink-0">
          {/* Date */}
          <div className="bg-[#785b82] rounded-xl flex items-center p-4 shadow-lg border-2 border-[#624a6a]">
            <div className="bg-white/20 p-3 rounded-lg shrink-0">
              <Calendar className="w-8 h-8 text-white" />
            </div>

            <div className="flex flex-col ml-6 text-right flex-1">
              <span className="text-white font-black text-[15px] tracking-widest drop-shadow-sm">
                TODAY'S DATE
              </span>

              <span className="text-white font-medium text-lg tracking-[0.15em] mt-1 drop-shadow-sm">
                202_ - __ - __
              </span>
            </div>
          </div>

          {/* Time */}
          <div className="bg-[#785b82] rounded-xl flex items-center p-4 shadow-lg border-2 border-[#624a6a]">
            <div className="bg-white/20 p-3 rounded-lg shrink-0">
              <Clock className="w-8 h-8 text-white" />
            </div>

            <div className="flex flex-col ml-6 text-right flex-1">
              <span className="text-white font-black text-[15px] tracking-widest drop-shadow-sm">
                CURRENT TIME
              </span>

              <span className="text-white font-medium text-lg tracking-[0.1em] mt-1 drop-shadow-sm">
                __ : __ : __ AM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcut tiles */}
      <nav className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6" aria-label="Departments">
        <RegistrarTile />
        <InfirmaryTile />
        <ScholarshipTile />
        <LocalStudentCouncilTile />
      </nav>

      {/* Latest Announcements + Quick Access */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <LatestAnnouncements items={ANNOUNCEMENTS} />
        <QuickAccess items={QUICK_FILES} />
      </div>
    </div>
  );
};

export default MainCenter;