"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BookOpen, FileText, Megaphone, RefreshCw } from "lucide-react";
import RequestStatCards, { type StatKey, type StatBreakdown } from "@/components/admin/RequestStatCards";
import type { Announcement } from "@/components/admin/DashboardPanels";
import {
  RegistrarRequests,
  loadRegistrarRows,
  DEFAULT_FILTERS,
  type RegistrarRow,
  type RequestFilters,
} from "@/components/admin/registrar/RegistrarPanels";
import { OfficeBottomRow, OfficeQuickActions, type QuickActionItem } from "@/components/admin/OfficeBottomRow";

const STATUS_BY_KEY: Record<StatKey, RequestFilters["status"]> = {
  total: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** Everything below the banner for the Registrar office. Mounted only when profiles.office is "registrar". */
export default function RegistrarSection({
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
  const [rows, setRows] = useState<RegistrarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filters, setFilters] = useState<RequestFilters>(DEFAULT_FILTERS);
  const requestsRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await loadRegistrarRows(); // never throws
    setRows(result.rows);
    setWarnings(result.errors);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const split = (list: RegistrarRow[]): StatBreakdown => ({
      documents: list.filter((r) => r.kind === "document").length,
      subjects: list.filter((r) => r.kind === "subject").length,
    });
    const byStatus = (s: RegistrarRow["status"]) => rows.filter((r) => r.status === s);
    const pending = byStatus("Pending");
    const approved = byStatus("Approved");
    const rejected = byStatus("Rejected");
    const breakdown: Record<StatKey, StatBreakdown> = {
      total: split(rows),
      pending: split(pending),
      approved: split(approved),
      rejected: split(rejected),
    };
    return {
      total: rows.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      breakdown,
      pendingDocuments: pending.filter((r) => r.kind === "document").length,
      pendingSubjects: pending.filter((r) => r.kind === "subject").length,
    };
  }, [rows]);

  const activeKey = (Object.keys(STATUS_BY_KEY) as StatKey[]).find((k) => STATUS_BY_KEY[k] === filters.status);

  const jumpToRequests = (patch: Partial<RequestFilters>) => {
    setFilters({ ...DEFAULT_FILTERS, ...patch });
    requestsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const actions: QuickActionItem[] = [
    {
      key: "docs",
      label: "Review pending documents",
      icon: FileText,
      badge: stats.pendingDocuments,
      onClick: () => jumpToRequests({ kind: "document", status: "Pending" }),
    },
    {
      key: "subjects",
      label: "Review add / remove subject",
      icon: BookOpen,
      badge: stats.pendingSubjects,
      onClick: () => jumpToRequests({ kind: "subject", status: "Pending" }),
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
      <RequestStatCards
        total={stats.total}
        pending={stats.pending}
        approved={stats.approved}
        rejected={stats.rejected}
        labels={approvedLabel ? { approved: approvedLabel } : undefined}
        breakdown={stats.breakdown}
        loading={loading}
        activeKey={activeKey}
        onSelect={(key) => jumpToRequests({ status: key === activeKey ? "All" : STATUS_BY_KEY[key] })}
      />

      <div ref={requestsRef} className="scroll-mt-4">
        <RegistrarRequests
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
