"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Megaphone, RefreshCw, Stethoscope } from "lucide-react";
import RequestStatCards, { type StatKey } from "@/components/admin/RequestStatCards";
import type { Announcement } from "@/components/admin/DashboardPanels";
import {
  InfirmaryRequests,
  loadInfirmaryRows,
  INFIRMARY_DEFAULT_FILTERS,
  type InfirmaryRow,
  type InfirmaryFilters,
} from "@/components/admin//infirmary/InfirmaryPanels";
import { OfficeBottomRow, OfficeQuickActions, type QuickActionItem } from "@/components/admin/OfficeBottomRow";

const STATUS_BY_KEY: Record<StatKey, InfirmaryFilters["status"]> = {
  total: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** Everything below the banner for the Infirmary office. Mounted only when profiles.office is "infirmary". */
export default function InfirmarySection({
  announcements,
  announcementsError,
  manageHref,
  approvedLabel,
}: {
  announcements: Announcement[];
  announcementsError: string | null;
  manageHref: string;
  approvedLabel?: string;
}) {
  const [rows, setRows] = useState<InfirmaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filters, setFilters] = useState<InfirmaryFilters>(INFIRMARY_DEFAULT_FILTERS);
  const requestsRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await loadInfirmaryRows(); // never throws
    setRows(result.rows);
    setWarnings(result.errors);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const count = (s: InfirmaryRow["status"]) => rows.filter((r) => r.status === s).length;
    return { total: rows.length, pending: count("Pending"), approved: count("Approved"), rejected: count("Rejected") };
  }, [rows]);

  const activeKey = (Object.keys(STATUS_BY_KEY) as StatKey[]).find((k) => STATUS_BY_KEY[k] === filters.status);

  const jumpToRequests = (patch: Partial<InfirmaryFilters>) => {
    setFilters({ ...INFIRMARY_DEFAULT_FILTERS, ...patch });
    requestsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const actions: QuickActionItem[] = [
    {
      key: "pending",
      label: "Review pending requests",
      icon: Stethoscope,
      badge: stats.pending,
      onClick: () => jumpToRequests({ status: "Pending" }),
    },
    {
      key: "refresh",
      label: loading ? "Refreshing…" : "Refresh requests",
      icon: RefreshCw,
      filled: false,
      spin: loading,
      disabled: loading,
      onClick: refresh,
    },
    { key: "announce", label: "Post an announcement", icon: Megaphone, href: manageHref },
  ];

  return (
    <>
      {/* No `breakdown`: its side panel is hard-coded to "Add / Remove Subject" vs "Document Request" */}
      <RequestStatCards
        total={stats.total}
        pending={stats.pending}
        approved={stats.approved}
        rejected={stats.rejected}
        labels={approvedLabel ? { approved: approvedLabel } : undefined}
        loading={loading}
        activeKey={activeKey}
        onSelect={(key) => jumpToRequests({ status: key === activeKey ? "All" : STATUS_BY_KEY[key] })}
      />

      <div ref={requestsRef} className="scroll-mt-4">
        <InfirmaryRequests
          rows={rows}
          loading={loading}
          warnings={warnings}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      <OfficeBottomRow
        announcements={announcements}
        announcementsError={announcementsError}
        manageHref={manageHref}
        right={<OfficeQuickActions actions={actions} />}
      />
    </>
  );
}
