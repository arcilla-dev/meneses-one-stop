"use client";

import React, { useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards"; // adjust to wherever you saved it
import {
  AppointmentRequestModal,
  ApproveAppointmentModal,
  RejectAppointmentModal,
  AppointmentResultModal,
} from "@/components/admin/infirmary/modals/AppointmentModals";
import type { DecisionOutcome } from "@/components/admin/DecisionModals";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

type RequestStatus = "Pending" | "Approved" | "Rejected";
type ServiceCategory = "MedConsult" | "VSC" | "Dental" | "MedCert" | "Other";
type CategoryTab = "ALL" | ServiceCategory;
type Stage = "details" | "approve" | "reject" | "result";

const CATEGORY_TABS: CategoryTab[] = ["ALL", "MedConsult", "VSC", "Dental", "MedCert", "Other"];

interface AppointmentRequest {
  id: number | string;
  service: string; // full label shown in the table
  category: ServiceCategory; // drives the filter tabs
  student_name: string;
  student_number: string;
  program_year_section: string; // e.g. "BSCpE - 4B"
  created_at: string; // ISO timestamp the request was submitted
  status: RequestStatus;
  // Details shown in the request modal
  preferred_date: string; // ISO timestamp
  preferred_time: string; // e.g. "01:00 PM - 02:00 PM"
  reason: string; // student's reason/remarks
}

// Section label above the table follows the selected stat card.
const SECTION_TITLES: Record<StatKey, string> = {
  total: "Appointment Requests",
  pending: "Pending Requests",
  approved: "Approved Requests",
  rejected: "Rejected Requests",
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  Pending: "bg-[#f5c542] text-[#39265f]",
  Approved: "bg-[#2e9e4f] text-white",
  Rejected: "bg-[#ff2d2d] text-white",
};

const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

const TABLE_HEADERS = ["Service", "Student Name", "Program/Yr/Sec", "Date", "Status"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

// Hardcoded stand-ins for the modal details. With Supabase these would come from the request row.
const SERVICES: Record<ServiceCategory, { label: string; time: string; reason: string }> = {
  MedConsult: { label: "Medical Consultation", time: "09:00 AM - 10:00 AM", reason: "Persistent headache and dizziness for the past three days." },
  VSC: { label: "Vital Signs Check", time: "10:00 AM - 10:30 AM", reason: "Required vital signs record before the laboratory class." },
  Dental: { label: "Dental Check-up", time: "02:00 PM - 03:00 PM", reason: "Tooth sensitivity and a routine cleaning." },
  MedCert: { label: "Medical Certificate", time: "01:00 PM - 02:00 PM", reason: "Needed to excuse an absence from last week's exams." },
  Other: { label: "Other Infirmary Requests", time: "03:00 PM - 04:00 PM", reason: "Request for a first aid refill for the department." },
};

// --- Mock data (stand-in for a Supabase table named "appointment_requests") ---
// Expected real columns: id, service, category, student_name, student_number, program_year_section,
// created_at, status, preferred_date, preferred_time, reason
// Mock totals match the wireframe: 69 total / 21 pending / 41 approved / 7 rejected.
interface Seed {
  category: ServiceCategory;
  student: string;
  date: string; // YYYY-MM-DD
  status: RequestStatus;
  service?: string; // overrides the default service label
}

const buildMockRequests = (): AppointmentRequest[] => {
  const pad = (n: number) => String(n).padStart(2, "0");

  // The 16 pending rows visible in the wireframe.
  const cycle: Array<[ServiceCategory, string, string]> = [
    ["MedConsult", "Josh Nathaniel R. Arcilla", "2026-05-10"],
    ["VSC", "Hazel Rose V. de Guzman", "2026-05-04"],
    ["Dental", "Cloiez Veniz L. Belmonte", "2026-05-01"],
    ["MedCert", "Jerome S. Lagarde", "2026-04-26"],
    ["Other", "Jerome S. Lagarde", "2026-04-26"],
  ];
  const wireframeSeeds: Seed[] = [
    ...Array.from({ length: 3 }, () => cycle).flat().map(([category, student, date]): Seed => ({
      category,
      student,
      date,
      status: "Pending",
    })),
    { category: "Other", student: "Jerome S. Lagarde", date: "2026-01-26", status: "Pending", service: "Wala kanen busseng?" },
  ];

  // 53 older rows so the totals line up with the stat cards in the wireframe.
  const categories = Object.keys(SERVICES) as ServiceCategory[];
  const names = ["Josh Nathaniel R. Arcilla", "Hazel Rose V. de Guzman", "Cloiez Veniz L. Belmonte", "Jerome S. Lagarde"];
  const olderSeeds: Seed[] = Array.from({ length: 53 }, (_, i) => {
    const d = new Date(2026, 0, 25 - i);
    return {
      category: categories[i % categories.length],
      student: names[i % names.length],
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      status: i < 5 ? "Pending" : i < 46 ? "Approved" : "Rejected",
    };
  });

  return [...wireframeSeeds, ...olderSeeds].map((seed, i) => {
    const svc = SERVICES[seed.category];
    const created_at = `${seed.date}T00:00:00`;
    return {
      id: i + 1,
      service: seed.service ?? svc.label,
      category: seed.category,
      student_name: seed.student,
      student_number: "202XXXXXXX",
      program_year_section: "BSCpE - 4B",
      created_at,
      status: seed.status,
      preferred_date: new Date(new Date(created_at).getTime() + 7 * 24 * 3600 * 1000).toISOString(),
      preferred_time: svc.time,
      reason: svc.reason,
    };
  });
};

export default function AppointmentRequestsPage() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("ALL");
  const [selectedId, setSelectedId] = useState<AppointmentRequest["id"] | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
      // const { data, error } = await supabase
      //   .from("appointment_requests")
      //   .select("*")
      //   .order("created_at", { ascending: false });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setRequests(data as AppointmentRequest[]);
      // }

      // --- Mock version (remove once Supabase is wired up) ---
      await new Promise((resolve) => setTimeout(resolve, 200));
      setRequests(buildMockRequests());

      setLoading(false);
    };

    loadRequests();
  }, []);

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((r) => {
        const matchesStatus = statusKey === "total" || r.status.toLowerCase() === statusKey;
        const matchesCategory = categoryTab === "ALL" || r.category === categoryTab;
        return matchesStatus && matchesCategory;
      }),
    [requests, statusKey, categoryTab]
  );

  // Always read the live row so the modals reflect the latest status after a decision.
  const current = requests.find((r) => r.id === selectedId) ?? null;

  const openRequest = (id: AppointmentRequest["id"]) => {
    setSelectedId(id);
    setStage("details");
  };

  const closeAll = () => {
    setStage(null);
    setSelectedId(null);
    setOutcome(null);
  };

  const setStatus = (id: AppointmentRequest["id"], status: "Approved" | "Rejected") =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const handleApprove = (remarks: string, notify: boolean) => {
    if (!current) return;
    setStatus(current.id, "Approved");
    setOutcome({ status: "Approved", remarks });
    setStage("result");
    // TODO (Supabase): await supabase.from("appointment_requests").update({ status: "Approved", remarks }).eq("id", current.id);
    // TODO (Supabase): if (notify) insert a row into "notifications" for the student.
  };

  const handleReject = (reason: string, remarks: string, notify: boolean) => {
    if (!current) return;
    setStatus(current.id, "Rejected");
    setOutcome({ status: "Rejected", reason, remarks });
    setStage("result");
    // TODO (Supabase): await supabase.from("appointment_requests").update({ status: "Rejected", reason, remarks }).eq("id", current.id);
    // TODO (Supabase): if (notify) insert a row into "notifications" for the student.
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-6xl mx-auto">
        {/* Stat cards double as the status filter */}
        <RequestStatCards
          {...counts}
          loading={loading}
          activeKey={statusKey}
          onSelect={setStatusKey}
        />

        {/* Service category tabs */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={categoryTab === tab}
                onClick={() => setCategoryTab(tab)}
                className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                  categoryTab === tab ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
        </div>

        {/* Table panel */}
        <section className="rounded-xl bg-[#d8abca] p-4 md:p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <h2
            className="inline-block mb-4 px-6 py-2 rounded-lg bg-[#b07aa1] text-white text-lg font-bold uppercase tracking-wide"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {SECTION_TITLES[statusKey]}
          </h2>

          {loading ? (
            <p className="text-center text-[#5a4a75] py-8">Loading requests...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-[#5a4a75] py-8">No requests found for this filter.</p>
          ) : (
            <div className="max-h-[55vh] overflow-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-sm text-[#39265f]">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h}
                        className="bg-[#b07aa1] text-white font-bold px-3 py-2 text-center"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((row) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      onClick={() => openRequest(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openRequest(row.id);
                        }
                      }}
                      className="cursor-pointer bg-[#f4e1eb] hover:bg-[#efd2e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] transition-colors"
                    >
                      <td className="px-3 py-2">{row.service}</td>
                      <td className="px-3 py-2">{row.student_name}</td>
                      <td className="px-3 py-2 text-center">{row.program_year_section}</td>
                      <td className="px-3 py-2 text-center">{formatDate(row.created_at)}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block min-w-[84px] px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {current && stage === "details" && (
        <AppointmentRequestModal
          request={current}
          onClose={closeAll}
          onApprove={() => setStage("approve")}
          onReject={() => setStage("reject")}
        />
      )}
      {current && stage === "approve" && (
        <ApproveAppointmentModal
          request={current}
          onCancel={() => setStage("details")}
          onConfirm={handleApprove}
        />
      )}
      {current && stage === "reject" && (
        <RejectAppointmentModal
          request={current}
          onCancel={() => setStage("details")}
          onConfirm={handleReject}
        />
      )}
      {current && stage === "result" && outcome && (
        <AppointmentResultModal
          request={current}
          outcome={outcome}
          onViewRequest={() => setStage("details")}
          onDone={closeAll}
        />
      )}
    </div>
  );
}
