"use client";

import React, { useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards"; // adjust to wherever you saved it
import {
  ScholarshipApplicationModal,
  ApproveApplicationModal,
  RejectApplicationModal,
  ApplicationResultModal,
  type Attachment,
} from "@/components/admin/scholarship/modals/ScholarshipModals";
import type { DecisionOutcome } from "@/components/admin/DecisionModals";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

type ApplicationStatus = "Pending" | "Approved" | "Rejected";
type Stage = "details" | "approve" | "reject" | "result";

const SCHOLARSHIP_TABS = ["ALL", "Academic Scholarship", "Financial Assistance", "Scholarship ni Josh"] as const;
type ScholarshipTab = (typeof SCHOLARSHIP_TABS)[number];

interface ScholarshipApplication {
  id: number | string;
  scholarship: string;
  student_name: string;
  student_number: string;
  program_year_section: string; // e.g. "BSCpE - 4B"
  created_at: string; // ISO timestamp the application was submitted
  status: ApplicationStatus;
  // Details shown in the application modal
  gpa: string; // e.g. "1.50"
  attachments: Attachment[];
}

// Section label above the table follows the selected stat card.
const SECTION_TITLES: Record<StatKey, string> = {
  total: "Scholarship Applications",
  pending: "Pending Applications",
  approved: "Approved Applications",
  rejected: "Rejected Applications",
};

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Pending: "bg-[#f5c542] text-[#39265f]",
  Approved: "bg-[#2e9e4f] text-white",
  Rejected: "bg-[#ff2d2d] text-white",
};

const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

const TABLE_HEADERS = ["Scholarship", "Student Name", "Program/Yr/Sec", "Date", "Status"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

// Hardcoded stand-ins for the modal details. With Supabase these would come from the application row
// (gpa, student_number) and the storage bucket holding the uploaded files (attachments).
const GPA_BY_STUDENT: Record<string, string> = {
  "Josh Nathaniel R. Arcilla": "1.50",
  "Hazel Rose V. de Guzman": "1.75",
  "Cloiez Veniz L. Belmonte": "1.50",
  "Jerome S. Lagarde": "2.00",
};

const ATTACHMENTS_BY_SCHOLARSHIP: Record<string, string[]> = {
  "Academic Scholarship": ["Grade_Report.pdf", "Certificate_of_Registration.pdf", "Recommendation_Letter.pdf"],
  "Financial Assistance": ["Income_Tax_Return.pdf", "Barangay_Indigency.pdf", "Certificate_of_Registration.pdf"],
};
const DEFAULT_ATTACHMENTS = ["Application_Form.pdf", "Certificate_of_Registration.pdf"];

// --- Mock data (stand-in for a Supabase table named "scholarship_applications") ---
// Expected real columns: id, scholarship, student_name, student_number, program_year_section,
// created_at, status, gpa, plus an attachments table or storage folder
// Mock totals match the wireframe: 69 total / 15 pending / 45 approved / 9 rejected.
type Seed = [scholarship: string, student: string, date: string, status: ApplicationStatus];

const buildMockApplications = (): ScholarshipApplication[] => {
  const JOSH = "Josh Nathaniel R. Arcilla";
  const HAZEL = "Hazel Rose V. de Guzman";
  const CLOIEZ = "Cloiez Veniz L. Belmonte";
  const JEROME = "Jerome S. Lagarde";
  const ACAD = "Academic Scholarship";
  const FIN = "Financial Assistance";
  const JOSHS = "Scholarship ni Josh";
  const pad = (n: number) => String(n).padStart(2, "0");

  // The 16 rows visible in the wireframe.
  const wireframeSeeds: Seed[] = [
    [FIN, JOSH, "2026-05-10", "Pending"],
    [ACAD, HAZEL, "2026-05-04", "Pending"],
    [ACAD, CLOIEZ, "2026-05-01", "Pending"],
    [JOSHS, JEROME, "2026-04-26", "Pending"],
    [FIN, JEROME, "2026-04-26", "Approved"],
    [FIN, JOSH, "2026-05-10", "Pending"],
    [ACAD, HAZEL, "2026-05-04", "Pending"],
    [ACAD, CLOIEZ, "2026-05-01", "Approved"],
    [JOSHS, JEROME, "2026-04-26", "Pending"],
    [FIN, JEROME, "2026-04-26", "Pending"],
    [FIN, JOSH, "2026-05-10", "Rejected"],
    [ACAD, HAZEL, "2026-05-04", "Approved"],
    [ACAD, CLOIEZ, "2026-05-01", "Pending"],
    [JOSHS, JEROME, "2026-04-26", "Rejected"],
    [FIN, JEROME, "2026-04-26", "Pending"],
    ["Wala kanen busseng?", JEROME, "2026-01-26", "Rejected"],
  ];

  // 53 older rows so the totals line up with the stat cards in the wireframe.
  const scholarships = [ACAD, FIN, JOSHS];
  const students = [JOSH, HAZEL, CLOIEZ, JEROME];
  const olderSeeds: Seed[] = Array.from({ length: 53 }, (_, i) => {
    const d = new Date(2026, 0, 25 - i);
    return [
      scholarships[i % scholarships.length],
      students[i % students.length],
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      i < 5 ? "Pending" : i < 47 ? "Approved" : "Rejected",
    ];
  });

  return [...wireframeSeeds, ...olderSeeds].map(([scholarship, student, date, status], i) => ({
    id: i + 1,
    scholarship,
    student_name: student,
    student_number: "202XXXXXXX",
    program_year_section: "BSCpE - 4B",
    created_at: `${date}T00:00:00`,
    status,
    gpa: GPA_BY_STUDENT[student],
    attachments: (ATTACHMENTS_BY_SCHOLARSHIP[scholarship] ?? DEFAULT_ATTACHMENTS).map((name) => ({
      name,
      url: "#", // TODO: signed URL from Supabase Storage
    })),
  }));
};

export default function ScholarshipApplicationsPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [tab, setTab] = useState<ScholarshipTab>("ALL");
  const [selectedId, setSelectedId] = useState<ScholarshipApplication["id"] | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
      // const { data, error } = await supabase
      //   .from("scholarship_applications")
      //   .select("*")
      //   .order("created_at", { ascending: false });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setApplications(data as ScholarshipApplication[]);
      // }

      // --- Mock version (remove once Supabase is wired up) ---
      await new Promise((resolve) => setTimeout(resolve, 200));
      setApplications(buildMockApplications());

      setLoading(false);
    };

    loadApplications();
  }, []);

  const counts = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === "Pending").length,
      approved: applications.filter((a) => a.status === "Approved").length,
      rejected: applications.filter((a) => a.status === "Rejected").length,
    }),
    [applications]
  );

  const filteredApplications = useMemo(
    () =>
      applications.filter((a) => {
        const matchesStatus = statusKey === "total" || a.status.toLowerCase() === statusKey;
        const matchesTab = tab === "ALL" || a.scholarship === tab;
        return matchesStatus && matchesTab;
      }),
    [applications, statusKey, tab]
  );

  // Always read the live row so the modals reflect the latest status after a decision.
  const current = applications.find((a) => a.id === selectedId) ?? null;

  const openApplication = (id: ScholarshipApplication["id"]) => {
    setSelectedId(id);
    setStage("details");
  };

  const closeAll = () => {
    setStage(null);
    setSelectedId(null);
    setOutcome(null);
  };

  const setStatus = (id: ScholarshipApplication["id"], status: "Approved" | "Rejected") =>
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

  const handleApprove = (remarks: string, notify: boolean) => {
    if (!current) return;
    setStatus(current.id, "Approved");
    setOutcome({ status: "Approved", remarks });
    setStage("result");
    // TODO (Supabase): await supabase.from("scholarship_applications").update({ status: "Approved", remarks }).eq("id", current.id);
    // TODO (Supabase): if (notify) insert a row into "notifications" for the student.
  };

  const handleReject = (reason: string, remarks: string, notify: boolean) => {
    if (!current) return;
    setStatus(current.id, "Rejected");
    setOutcome({ status: "Rejected", reason, remarks });
    setStage("result");
    // TODO (Supabase): await supabase.from("scholarship_applications").update({ status: "Rejected", reason, remarks }).eq("id", current.id);
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

        {/* Scholarship tabs */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2">
            {SCHOLARSHIP_TABS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                  tab === t ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {t}
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
            <p className="text-center text-[#5a4a75] py-8">Loading applications...</p>
          ) : filteredApplications.length === 0 ? (
            <p className="text-center text-[#5a4a75] py-8">No applications found for this filter.</p>
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
                  {filteredApplications.map((row) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      onClick={() => openApplication(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openApplication(row.id);
                        }
                      }}
                      className="cursor-pointer bg-[#f4e1eb] hover:bg-[#efd2e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] transition-colors"
                    >
                      <td className="px-3 py-2">{row.scholarship}</td>
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
        <ScholarshipApplicationModal
          request={{ ...current, application_date: current.created_at }}
          onClose={closeAll}
          onApprove={() => setStage("approve")}
          onReject={() => setStage("reject")}
        />
      )}
      {current && stage === "approve" && (
        <ApproveApplicationModal
          request={{ ...current, application_date: current.created_at }}
          onCancel={() => setStage("details")}
          onConfirm={handleApprove}
        />
      )}
      {current && stage === "reject" && (
        <RejectApplicationModal
          request={{ ...current, application_date: current.created_at }}
          onCancel={() => setStage("details")}
          onConfirm={handleReject}
        />
      )}
      {current && stage === "result" && outcome && (
        <ApplicationResultModal
          request={{ ...current, application_date: current.created_at }}
          outcome={outcome}
          onViewApplication={() => setStage("details")}
          onDone={closeAll}
        />
      )}
    </div>
  );
}
