'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Calendar, Clock } from 'lucide-react';

type Announcement = { id: number; title: string; date: string };

// TODO: replace with the logged-in student's first name
const FIRST_NAME = 'Juana';

// TODO: replace with data from your API
const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: 'Final examination schedule for the first semester', date: 'Dec 16, 2026' },
  { id: 2, title: 'Enrollment for the second semester opens', date: 'Mar 25, 2026' },
  { id: 3, title: 'Scholarship application deadline extended', date: 'Mar 25, 2026' },
  { id: 4, title: 'Campus clinic hours updated', date: 'Mar 25, 2026' },
  { id: 5, title: 'Student council elections', date: 'Mar 20, 2026' },
];

// TODO: replace with real recent files
const QUICK_FILES = [
  { id: 1, label: 'Recent Files', href: '#recent' },
  { id: 2, label: '', href: '#file-2' },
  { id: 3, label: '', href: '#file-3' },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Michroma&family=Great+Vibes&family=Montserrat:wght@800&display=swap');

.mc-root {
  --rose: #c58bb0; --rose-light: #d9aecb; --title: #3d2c66;
  background: #ffd6ec; font-family: 'Times New Roman', serif; padding: 20px 34px;
}
.mc-root * { box-sizing: border-box; }
.mc-root h2 { margin: 0; }

/* Shortcut tiles */
.st-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 22px; }
.st-tile {
  position: relative; height: 88px; border-radius: 8px; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  padding: 0 6px 8px; color: #fff; text-decoration: none; text-align: center;
  font-family: 'Playfair Display', serif; font-weight: 700;
  font-size: clamp(14px, 1.4vw, 19px); line-height: 1.1;
  background-color: #5a3d6e;
  background-image: linear-gradient(rgba(91, 74, 120, .85), rgba(60, 30, 50, .88)), var(--st-img, none);
  background-size: cover; background-position: center;
  transition: transform .15s;
}
.st-tile:hover { transform: translateY(-2px); }
.st-tile:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.st-badge {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
  width: 38px; height: 38px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff, #d9a0c5 70%);
  display: grid; place-items: center;
}
.st-badge svg { width: 22px; height: 22px; fill: #000; }

/* Announcements + quick access */
.mc-main { display: grid; grid-template-columns: 1fr 282px; gap: 18px; align-items: start; }

.mc-announcements {
  border-radius: 8px; padding: 14px 30px 16px;
  background: linear-gradient(135deg, #b98aa6 0%, #f6d3ea 28%, #f6d3ea 70%, #bf93ad 100%);
}
.mc-announcements h2 {
  font-family: 'Michroma', sans-serif; font-weight: 400; font-size: clamp(18px, 2vw, 27px);
  color: var(--title); text-align: center; margin-bottom: 18px; white-space: nowrap;
}
.mc-list { max-height: 216px; overflow-y: auto; padding-right: 14px; scrollbar-width: thin; scrollbar-color: #c9a2bd transparent; }
.mc-item {
  position: relative; display: flex; align-items: center; gap: 14px;
  min-height: 54px; padding: 8px 12px 24px; cursor: pointer;
  background: var(--rose-light); color: #000;
}
.mc-item:nth-child(odd) { background: var(--rose); color: #fff; }
.mc-item:first-child { border-radius: 6px 6px 0 0; }
.mc-item + .mc-item { margin-top: 1px; }
.mc-item:focus-visible { outline: 2px solid var(--title); outline-offset: -2px; }
.mc-gear { width: 38px; height: 38px; flex: none; }
.mc-item-title { flex: 1; font-size: 16px; line-height: 1.3; }
.mc-item time { position: absolute; right: 8px; bottom: 4px; font-size: 14px; }
.mc-item:nth-child(odd) time { font-weight: 700; }
.mc-more { display: block; margin: 14px auto 0; width: 60px; height: 22px; background: none; border: 0; cursor: pointer; }
.mc-more svg { width: 100%; height: 100%; fill: #5b4a6e; }

.mc-quick { border-radius: 8px; padding: 18px 30px 26px; color: #fff; background: linear-gradient(135deg, #62507f, #4e3f68); }
.mc-quick h2 { font-family: 'Playfair Display', serif; font-size: 27px; margin-bottom: 18px; }
.mc-quick a { display: flex; align-items: center; gap: 22px; min-height: 56px; margin-bottom: 14px; color: #fff; text-decoration: none; }
.mc-quick a:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
.mc-doc { width: 30px; height: 36px; flex: none; }
.mc-label { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 22px; }
.mc-line { flex: 1; height: 1px; margin-top: 18px; border-bottom: 1px solid #fff; }

@media (max-width: 900px) {
  .mc-main { grid-template-columns: 1fr; }
  .st-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .mc-announcements h2 { white-space: normal; }
}
`;

/* ---------- Reusable tile ---------- */
type ShortcutTileProps = {
  label: string;
  href: string;
  icon: ReactNode;
  image?: string; // optional background photo, e.g. '/images/registrar.jpg'
};

function ShortcutTile({ label, href, icon, image }: ShortcutTileProps) {
  const style = image ? ({ '--st-img': `url(${image})` } as CSSProperties) : undefined;

  return (
    <a className="st-tile" href={href} style={style}>
      <span className="st-badge">{icon}</span>
      {label}
    </a>
  );
}

/* ---------- Individual tiles ---------- */
const RegistrarTile = () => (
  <ShortcutTile
    label="Registrar"
    href="#registrar"
    icon={
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3h13l5 5v13H3V3zm3 4v2h8V7H6zm0 4v2h12v-2H6zm0 4v2h8v-2H6z" />
      </svg>
    }
  />
);

const InfirmaryTile = () => (
  <ShortcutTile
    label="Infirmary"
    href="#infirmary"
    icon={
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
      </svg>
    }
  />
);

const ScholarshipTile = () => (
  <ShortcutTile
    label="Scholarship"
    href="#scholarship"
    icon={
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 0 9l12 6 9-4.5V17h2V9L12 3zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.5-7-3.5z" />
      </svg>
    }
  />
);

const LocalStudentCouncilTile = () => (
  <ShortcutTile
    label="LSC"
    href="#council"
    icon={
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="6" r="3.2" />
        <circle cx="4.5" cy="8.5" r="2.5" />
        <circle cx="19.5" cy="8.5" r="2.5" />
        <path d="M12 10c-3 0-5 2-5 5v5h10v-5c0-3-2-5-5-5zM4.5 12C2.5 12 1 13.5 1 15.5V19h4v-4c0-1.2.4-2.2 1-3-.5 0-1-.1-1.5-.1zM19.5 12c-.5 0-1 .1-1.5.2.6.8 1 1.8 1 2.8v4h4v-3.5c0-2-1.5-3.5-3.5-3.5z" />
      </svg>
    }
  />
);

/* ---------- Other icons ---------- */
const DocIcon = () => (
  <svg className="mc-doc" viewBox="0 0 30 36" aria-hidden="true">
    <path fill="#d48fb9" d="M0 3a3 3 0 0 1 3-3h16l11 11v22a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3z" />
    <path stroke="#5b4a78" strokeWidth="2" d="M7 17h16M7 22h16M7 27h16" />
  </svg>
);

const GearIcon = () => (
  <svg className="mc-gear" viewBox="0 0 40 40" aria-hidden="true">
    <path
      fill="url(#mc-gear-grad)"
      stroke="#3d2c66"
      strokeWidth="1.5"
      d="M17 2h6l1 4.5 3.5 1.5 4-2.5 4.2 4.2-2.5 4 1.5 3.5 4.5 1v6l-4.5 1-1.5 3.5 2.5 4-4.2 4.2-4-2.5L24 34l-1 4.5h-6L16 34l-3.5-1.5-4 2.5-4.2-4.2 2.5-4L5 23.5.5 22.5v-6L5 15.5 6.5 12l-2.5-4L8.2 3.8l4 2.5L16 6.5z"
    />
    <circle cx="20" cy="20" r="7" fill="#f6d3ea" stroke="#3d2c66" strokeWidth="1.5" />
  </svg>
);

const pad = (n: number) => String(n).padStart(2, '0');

/* ---------- Page section ---------- */
export default function MainCenter() {
  const listRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<Date | null>(null);

  // Live clock (starts after mount to avoid a hydration mismatch)
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = now?.getHours() ?? 0;
  const greeting = !now ? 'WELCOME' : hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const dateText = now ? `${now.getFullYear()} - ${pad(now.getMonth() + 1)} - ${pad(now.getDate())}` : '202_ - __ - __';
  const timeText = now ? `${pad(now.getHours() % 12 || 12)} : ${pad(now.getMinutes())} : ${pad(now.getSeconds())}` : '__ : __ : __';
  const ampm = hour < 12 ? 'AM' : 'PM';

  return (
    <div className="mc-root">
      <style>{CSS}</style>

      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="mc-gear-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b57aa6" />
            <stop offset="1" stopColor="#5b5f9e" />
          </linearGradient>
        </defs>
      </svg>

      {/* Hero + date/time */}
      <div className="flex flex-col xl:flex-row gap-6 mb-5">
        {/* Banner */}
        <section
          aria-label="Welcome"
          className="flex-1 h-[220px] rounded-xl relative overflow-hidden shadow-xl flex flex-col items-center justify-center border-2 border-[#543b59]"
        >
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

            <h1 className="text-3xl md:text-5xl font-black tracking-wide mt-1">
              {greeting},{' '}
              <span
                className="font-normal ml-1 text-pink-100"
                style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.2em' }}
              >
                {FIRST_NAME}!
              </span>
            </h1>

            <p className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-gray-300 mt-2">
              Welcome back to your dashboard
            </p>
          </div>
        </section>

        {/* Date & Time */}
        <div className="flex flex-col gap-4 w-full xl:w-[320px] shrink-0">
          <div className="bg-[#785b82] rounded-xl flex items-center p-4 shadow-lg border-2 border-[#624a6a]">
            <div className="bg-white/20 p-3 rounded-lg shrink-0">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col ml-6 text-right flex-1">
              <span className="text-white font-black text-[15px] tracking-widest">TODAY&apos;S DATE</span>
              <span className="text-white font-medium text-lg tracking-[0.15em] mt-1">{dateText}</span>
            </div>
          </div>

          <div className="bg-[#785b82] rounded-xl flex items-center p-4 shadow-lg border-2 border-[#624a6a]">
            <div className="bg-white/20 p-3 rounded-lg shrink-0">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col ml-6 text-right flex-1">
              <span className="text-white font-black text-[15px] tracking-widest">CURRENT TIME</span>
              <span className="text-white font-medium text-lg tracking-[0.1em] mt-1">
                {timeText} {ampm}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcut tiles */}
      <nav className="st-grid" aria-label="Departments">
        <RegistrarTile />
        <InfirmaryTile />
        <ScholarshipTile />
        <LocalStudentCouncilTile />
      </nav>

      <div className="mc-main">
        <section className="mc-announcements" aria-labelledby="mc-ann-title">
          <h2 id="mc-ann-title">Latest Announcements</h2>
          <div className="mc-list" ref={listRef}>
            {ANNOUNCEMENTS.map((a) => (
              <div key={a.id} className="mc-item" tabIndex={0}>
                <GearIcon />
                <span className="mc-item-title">{a.title}</span>
                <time>{a.date}</time>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mc-more"
            aria-label="Show more announcements"
            onClick={() => listRef.current?.scrollBy({ top: 108, behavior: 'smooth' })}
          >
            <svg viewBox="0 0 60 22" aria-hidden="true">
              <path d="M0 2h14l16 12L46 2h14L30 22z" />
            </svg>
          </button>
        </section>

        <aside className="mc-quick" aria-labelledby="mc-qa-title">
          <h2 id="mc-qa-title">Quick Access</h2>
          {QUICK_FILES.map((f) => (
            <a key={f.id} href={f.href}>
              <DocIcon />
              {f.label ? <span className="mc-label">{f.label}</span> : <span className="mc-line" />}
            </a>
          ))}
        </aside>
      </div>
    </div>
  );
}