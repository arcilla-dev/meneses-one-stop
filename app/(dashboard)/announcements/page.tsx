
'use client';

import { useMemo, useState } from 'react';
import NotificationItem, { type Notif } from '@/components/NotificationItem';

type Sort = 'recent' | 'oldest';
type Announcement = Omit<Notif, 'read' | 'important'> & { hoursAgo: number };

// TODO: replace with data from your API
const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, kind: 'cor', title: 'Enrollment Schedule for 2nd Semester 2026-2027', body: 'Check your assigned enrollment date and time.', time: '2h ago', hoursAgo: 2 },
  { id: 2, kind: 'infirmary', title: 'Free Medical Check-up for BSU-MC Students', body: 'Bring your school ID to the campus clinic.', time: '4h ago', hoursAgo: 4 },
  { id: 3, kind: 'cor', title: 'Registrar Office Advisory', body: 'Document request processing times have changed.', time: '1d ago', hoursAgo: 24 },
  { id: 4, kind: 'scholarship', title: 'Scholarship Results Released', body: 'Results are now posted at the Scholarship Office.', time: '1d ago', hoursAgo: 25 },
  { id: 5, kind: 'scholarship', title: 'Scholarship Application Open', body: 'Submit your requirements before the deadline.', time: '2d ago', hoursAgo: 48 },
  { id: 6, kind: 'lsc', title: 'LSC Printing Services Update', body: 'New printing rates and schedule.', time: '2d ago', hoursAgo: 49 },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Montserrat:wght@700&display=swap');

.an-root { --plum: #4a3a63; --rose: #c58bb0; background: #ffd6ec; padding: 20px 24px; font-family: 'Playfair Display', serif; }
.an-root * { box-sizing: border-box; }
.an-card { border-radius: 10px; padding: 18px 40px 16px; background: linear-gradient(160deg, #ffe3f1, #fbd0e7); color: var(--plum); }

.an-head { display: flex; align-items: center; gap: 12px; }
.an-head svg { width: 48px; height: 48px; fill: var(--plum); flex: none; }
.an-head h1 { margin: 0; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: clamp(26px, 3vw, 36px); letter-spacing: 1px; }
.an-sub { margin: 0 0 4px 60px; font-size: 14px; }
.an-rule { display: flex; align-items: center; gap: 6px; margin: 4px 0 12px; }
.an-rule::before, .an-rule::after { content: ''; flex: 1; height: 1px; background: var(--plum); }
.an-rule span { width: 6px; height: 6px; background: var(--plum); transform: rotate(45deg); }

.an-tools { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.an-select-wrap { position: relative; }
.an-select { appearance: none; border: 0; cursor: pointer; padding: 6px 40px 6px 44px; border-radius: 6px; min-width: 190px;
  background: rgba(197, 139, 176, .75); color: #fff; font: 700 15px 'Playfair Display', serif; }
.an-select-wrap svg { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; fill: var(--plum); pointer-events: none; }
.an-select:focus-visible, .an-sbtn:focus-visible { outline: 2px solid var(--plum); outline-offset: 2px; }
.an-sbtn { margin-left: auto; width: 38px; height: 32px; border: 0; border-radius: 6px; cursor: pointer; background: rgba(197, 139, 176, .65); display: grid; place-items: center; }
.an-sbtn svg { width: 22px; height: 22px; fill: var(--plum); }
.an-search { width: 100%; margin-bottom: 12px; padding: 8px 12px; border: 1px solid var(--plum); border-radius: 6px; background: #fff3f9; font: 15px 'Playfair Display', serif; color: var(--plum); }

.an-list { max-height: 420px; overflow-y: auto; padding-right: 12px; display: grid; gap: 6px; scrollbar-width: thin; scrollbar-color: #b98aa6 transparent; }
.an-empty { padding: 28px; text-align: center; }
@media (max-width: 700px) { .an-card { padding: 16px; } .an-sub { margin-left: 0; } }
`;

export default function Announcements() {
  const [sort, setSort] = useState<Sort>('recent');
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ANNOUNCEMENTS.filter((a) => !q || a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)).sort((a, b) =>
      sort === 'recent' ? a.hoursAgo - b.hoursAgo : b.hoursAgo - a.hoursAgo,
    );
  }, [query, sort]);

  return (
    <div className="an-root">
      <style>{CSS}</style>
      <section className="an-card" aria-labelledby="an-title">
        <div className="an-head">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 11v2h4v-2h-4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" />
          </svg>
          <h1 id="an-title">Announcements</h1>
        </div>
        <p className="an-sub">Official posts from different offices.</p>
        <div className="an-rule" aria-hidden="true"><span /></div>

        <div className="an-tools">
          <div className="an-select-wrap">
            <select className="an-select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort announcements">
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
            </select>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
          </div>
          <button type="button" className="an-sbtn" aria-label="Search announcements" onClick={() => setShowSearch((s) => !s)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </button>
        </div>

        {showSearch && (
          <input className="an-search" type="search" placeholder="Search announcements" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        )}

        <div className="an-list">
          {visible.length === 0 && <p className="an-empty">No announcements found.</p>}
          {visible.map((a) => (
            <NotificationItem key={a.id} data={{ ...a, read: false, important: false }} />
          ))}
        </div>
      </section>
    </div>
  );
}