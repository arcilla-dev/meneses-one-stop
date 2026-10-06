import type { ReactNode } from 'react';

export type NotifKind = 'scholarship' | 'infirmary' | 'cor' | 'lsc';

export type Notif = {
  id: number;
  kind: NotifKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
  important: boolean;
};

const ICONS: Record<NotifKind, ReactNode> = {
  scholarship: <path d="M12 3 0 9l12 6 9-4.5V17h2V9L12 3zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.5-7-3.5z" />,
  infirmary: <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />,
  cor: <path d="M3 3h13l5 5v13H3V3zm3 4v2h8V7H6zm0 4v2h12v-2H6zm0 4v2h8v-2H6z" />,
  lsc: (
    <>
      <circle cx="12" cy="6" r="3.2" />
      <circle cx="4.5" cy="8.5" r="2.5" />
      <circle cx="19.5" cy="8.5" r="2.5" />
      <path d="M12 10c-3 0-5 2-5 5v5h10v-5c0-3-2-5-5-5zM4.5 12C2.5 12 1 13.5 1 15.5V19h4v-4c0-1.2.4-2.2 1-3-.5 0-1-.1-1.5-.1zM19.5 12c-.5 0-1 .1-1.5.2.6.8 1 1.8 1 2.8v4h4v-3.5c0-2-1.5-3.5-3.5-3.5z" />
    </>
  ),
};

const CSS = `
.nt-row { display: flex; align-items: center; gap: 14px; padding: 8px 14px; border-radius: 8px; cursor: pointer; text-align: left; width: 100%;
  border: 1px solid #7a5b8a; background: rgba(255, 220, 240, .75); color: var(--plum, #4a3a63); font: inherit; }
.nt-row.read { opacity: .72; }
.nt-row.important { background: rgba(197, 139, 176, .6); border: 2px solid var(--plum, #4a3a63); }
.nt-row:focus-visible { outline: 2px solid var(--plum, #4a3a63); outline-offset: 2px; }
.nt-ic { position: relative; width: 38px; height: 38px; flex: none; border-radius: 50%; background: #6d5a8c; display: grid; place-items: center; }
.nt-ic svg { width: 22px; height: 22px; fill: #fff; }
.nt-ic i { position: absolute; top: -2px; right: -2px; width: 11px; height: 11px; border-radius: 50%; background: var(--plum, #4a3a63); border: 2px solid #ffd6ec; }
.nt-text { flex: 1; min-width: 0; }
.nt-text b { display: block; font-size: 17px; }
.nt-text small { display: block; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nt-time { font-weight: 700; font-size: 15px; white-space: nowrap; }
`;

type NotificationItemProps = {
  data: Notif;
  onSelect?: (id: number) => void;
};

export default function NotificationItem({ data, onSelect }: NotificationItemProps) {
  const { id, kind, title, body, time, read, important } = data;

  return (
    <button
      type="button"
      className={`nt-row${read ? ' read' : ''}${important ? ' important' : ''}`}
      onClick={() => onSelect?.(id)}
    >
      <style>{CSS}</style>
      <span className="nt-ic">
        <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[kind]}</svg>
        {important && <i />}
      </span>
      <span className="nt-text">
        <b>{title}</b>
        <small>{body}</small>
      </span>
      <span className="nt-time">{time}</span>
    </button>
  );
}