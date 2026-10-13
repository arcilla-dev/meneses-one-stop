"use client";

import React from "react";
import { ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react";

export type StatKey = "total" | "pending" | "approved" | "rejected";

/** Optional split of a count by request type, shown in the small panel on the right of a card. */
export interface StatBreakdown {
  documents: number; // Document Request
  subjects: number; // Add / Remove Subject
}

export interface RequestStatCardsProps {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  /** Overrides the default card labels, e.g. { approved: "Processed" }. */
  labels?: Partial<Record<StatKey, string>>;
  /** Per-card breakdown. A card without an entry shows no side panel. */
  breakdown?: Partial<Record<StatKey, StatBreakdown>>;
  /** Highlights one card (purple ring). Only meaningful together with onSelect. */
  activeKey?: StatKey;
  /** When provided, the cards become buttons (e.g. to filter a table by status). */
  onSelect?: (key: StatKey) => void;
  /** Shows "—" instead of the numbers while data is loading. */
  loading?: boolean;
  className?: string;
}

interface CardConfig {
  key: StatKey;
  label: string;
  Icon: React.ElementType;
  surface: string; // card background
  accent: string; // color of the faint background icon
}

// Order, labels and look are fixed so every page that uses this shows the same four cards.
const CARDS: CardConfig[] = [
  {
    key: "total",
    label: "Total Requests",
    Icon: ClipboardList,
    surface: "bg-gradient-to-br from-[#5b4378] to-[#2f1f4a]",
    accent: "text-[#e2d5e3]",
  },
  {
    key: "pending",
    label: "Pending",
    Icon: Clock,
    surface: "bg-gradient-to-br from-[#b58aa6] to-[#6d5b7a]",
    accent: "text-[#f5c542]",
  },
  {
    key: "approved",
    label: "Approved",
    Icon: CheckCircle2,
    surface: "bg-gradient-to-br from-[#b58aa6] to-[#6d5b7a]",
    accent: "text-[#5cc26a]",
  },
  {
    key: "rejected",
    label: "Rejected",
    Icon: XCircle,
    surface: "bg-gradient-to-br from-[#b58aa6] to-[#6d5b7a]",
    accent: "text-[#f53c3d]",
  },
];

const CARD_BASE =
  "relative overflow-hidden w-full h-[110px] flex items-center justify-between gap-3 p-4 rounded-xl text-left text-white shadow-[0_2px_4px_rgba(0,0,0,0.12)]";

function BreakdownPanel({ data }: { data: StatBreakdown }) {
  const sum = data.documents + data.subjects;
  const docShare = sum === 0 ? 0 : (data.documents / sum) * 100;
  return (
    <div className="relative hidden xl:flex shrink-0 w-[96px] flex-col gap-1 p-2 rounded-lg bg-black/30 text-[10px] leading-tight">
      <div className="flex items-center justify-between gap-1">
        <span className="flex items-center gap-1 min-w-0">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#e2d5e3]" />
          <span className="truncate">Add / Remove Subject</span>
        </span>
        <span className="font-bold">{data.subjects}</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="flex items-center gap-1 min-w-0">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#a686b3]" />
          <span className="truncate">Document Request</span>
        </span>
        <span className="font-bold">{data.documents}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full overflow-hidden bg-[#e2d5e3]" aria-hidden="true">
        <div className="h-full bg-[#a686b3]" style={{ width: `${docShare}%` }} />
      </div>
    </div>
  );
}

function CardContent({
  config,
  value,
  breakdown,
  loading,
}: {
  config: CardConfig;
  value: number;
  breakdown?: StatBreakdown;
  loading?: boolean;
}) {
  const { Icon, label, accent } = config;
  return (
    <>
      {/* Faint status icon behind the number */}
      <Icon
        aria-hidden="true"
        size={92}
        strokeWidth={1.5}
        className={`absolute -left-3 -bottom-4 opacity-25 ${accent}`}
      />

      <div className="relative flex flex-col min-w-0">
        <span className="text-lg font-bold leading-tight" style={{ fontFamily: "Georgia, serif" }}>
          {label}
        </span>
        <span className="text-5xl font-semibold leading-none mt-1" style={{ fontFamily: "Georgia, serif" }}>
          {loading ? "—" : value.toLocaleString("en-US")}
        </span>
      </div>

      {breakdown && !loading && <BreakdownPanel data={breakdown} />}
    </>
  );
}

export default function RequestStatCards({
  total,
  pending,
  approved,
  rejected,
  breakdown,
  activeKey,
  onSelect,
  loading = false,
  className = "",
}: RequestStatCardsProps) {
  const values: Record<StatKey, number> = { total, pending, approved, rejected };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {CARDS.map((config) => {
        const content = (
          <CardContent
            config={config}
            value={values[config.key]}
            breakdown={breakdown?.[config.key]}
            loading={loading}
          />
        );

        if (!onSelect) {
          return (
            <div key={config.key} className={`${CARD_BASE} ${config.surface}`}>
              {content}
            </div>
          );
        }

        const isActive = activeKey === config.key;
        return (
          <button
            key={config.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(config.key)}
            className={`${CARD_BASE} ${config.surface} cursor-pointer transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#9b51e0] ring-offset-[#FEEAEE] ${
              isActive ? "ring-2 ring-offset-2 ring-[#9b51e0]" : ""
            }`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
