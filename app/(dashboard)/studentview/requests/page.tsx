"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  FileSignature,
  PlusSquare,
  GraduationCap,
  Users,
  ChevronRight,
  Plus,
} from "lucide-react";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

type RequestStatus = "Pending" | "Approved" | "Rejected";
type TabOption = "All" | RequestStatus;

interface RequestItem {
  id: number | string;
  title: string;
  office: string;
  date: string;
  status: RequestStatus;
  request_type: string; // used to pick an icon — keep this column if you add Supabase later
}

// Maps a request_type string (e.g. from a "request_type" column in Supabase)
// to a lucide icon. Add new mappings here as you add new request categories.
const ICON_MAP: Record<string, React.ElementType> = {
  certificate: FileSignature,
  medical: PlusSquare,
  scholarship: GraduationCap,
  printing: Users,
};

const getIconForType = (type: string) => ICON_MAP[type] ?? FileText;

// --- Mock data (acts as a stand-in for a Supabase table named "requests") ---
// Expected real columns: id, user_id, title, office, date, status, request_type
const MOCK_REQUESTS: RequestItem[] = [
  {
    id: 1,
    title: "Certificate of Enrollment",
    office: "Registrar",
    date: "Dec 25, 2026",
    status: "Pending",
    request_type: "certificate",
  },
  {
    id: 2,
    title: "Medical Consultation",
    office: "Infirmary",
    date: "Mar 25, 2026",
    status: "Approved",
    request_type: "medical",
  },
  {
    id: 3,
    title: "Scholarship Application",
    office: "Infirmary",
    date: "Mar 25, 2026",
    status: "Rejected",
    request_type: "scholarship",
  },
  {
    id: 4,
    title: "Printing Services",
    office: "Infirmary",
    date: "Mar 25, 2026",
    status: "Approved",
    request_type: "printing",
  },
];

const TAB_COLORS: Record<TabOption, string> = {
  All: "bg-[#c195b6] text-white",
  Pending: "bg-[#fce554] text-[#3b2a5e]",
  Approved: "bg-[#67d953] text-[#3b2a5e]",
  Rejected: "bg-[#f53c3d] text-white",
};

export default function MainContent() {
  const [activeTab, setActiveTab] = useState<TabOption>("All");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
      // const { data: { user } } = await supabase.auth.getUser();
      // const { data, error } = await supabase
      //   .from("requests")
      //   .select("*")
      //   .eq("user_id", user?.id)
      //   .order("date", { ascending: false });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setRequests(data as RequestItem[]);
      // }

      // --- Mock version (remove once Supabase is wired up) ---
      await new Promise((resolve) => setTimeout(resolve, 200)); // simulate fetch delay
      setRequests(MOCK_REQUESTS);

      setLoading(false);
    };

    loadRequests();
  }, []);

  // This is the actual filtering logic — previously missing.
  const filteredRequests =
    activeTab === "All" ? requests : requests.filter((item) => item.status === activeTab);

  return (
    <div className="flex-1 h-full min-h-screen bg-[#feeaee] p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[#39265f]">
            <FileText size={48} strokeWidth={1.5} className="fill-[#39265f] text-white" />
            <h1 className="text-5xl font-semibold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              My Requests
            </h1>
          </div>

          {/* New Request button */}
          <button
            type="button"
            onClick={() => {
              // TODO: open a "new request" form/modal, or router.push to a form page
              console.log("New request clicked");
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-[#39265f] shadow-md hover:brightness-110 active:scale-95 transition"
          >
            <Plus size={20} strokeWidth={3} />
            New Request
          </button>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-4 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
        </div>

        {/* Tabs Section */}
        <div className="flex gap-4 mb-8">
          {(["All", "Pending", "Approved", "Rejected"] as TabOption[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-lg shadow-sm transition-transform hover:scale-105 active:scale-95 ${TAB_COLORS[tab]} ${
                activeTab === tab ? "ring-2 ring-offset-2 ring-[#39265f]/30" : "opacity-90"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List Section */}
        {loading ? (
          <p className="text-center text-[#5a4a75] py-8">Loading requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="text-center text-[#5a4a75] py-8">
            No {activeTab !== "All" ? activeTab.toLowerCase() : ""} requests yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRequests.map((item) => {
              const Icon = getIconForType(item.request_type);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200
                    bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] shadow-[0_2px_4px_rgba(0,0,0,0.05)]
                    border border-[#d3bbcc] hover:border-[#9b51e0]"
                >
                  {/* Left Side: Icon & Details */}
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] flex items-center justify-center shadow-inner">
                      <Icon size={28} className="text-[#e2d5e3]" />
                    </div>

                    <div className="flex flex-col">
                      <h3
                        className="text-[1.15rem] font-bold text-[#39265f] mb-0.5"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#5a4a75] font-medium">{item.office}</p>
                      <p className="text-sm text-[#5a4a75]">{item.date}</p>
                    </div>
                  </div>

                  {/* Right Side: Status Badge & Chevron */}
                  <div className="flex items-center gap-6">
                    <div
                      className={`px-6 py-1.5 rounded-full font-bold text-sm min-w-[110px] text-center shadow-sm ${TAB_COLORS[item.status]}`}
                    >
                      {item.status}
                    </div>
                    <ChevronRight size={32} strokeWidth={3} className="text-[#6d5b7a]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}