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
import { Dela_Gothic_One } from "next/font/google";
import Image from "next/image";

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

// Uncomment when connecting to Supabase:
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
  request_type: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  certificate: FileSignature,
  medical: PlusSquare,
  scholarship: GraduationCap,
  printing: Users,
};

const getIconForType = (type: string) =>
  ICON_MAP[type] ?? FileText;

/* ---------- Shared UI tokens (identical across all pages) ---------- */
const NAV_BTN =
  "flex h-14 w-full items-center justify-center rounded-lg border-2 border-[#956084] px-3 text-center text-sm leading-tight tracking-wide shadow-sm transition hover:brightness-105 active:scale-95 md:h-16 md:text-base";
const ACTION_BTN =
  "flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-[#39265f]/30 bg-[#956084] px-5 text-sm tracking-wide text-white shadow-md transition hover:bg-[#80506f] active:scale-95 md:h-14 md:px-6 md:text-base";
const CARD_TITLE = "text-base font-bold text-[#39265f] sm:text-lg";
const CARD_TEXT = "text-sm text-[#6d5b7a]";
const ICON_BADGE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#956084] bg-[#c48ab2]/70 sm:h-14 sm:w-14";

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
  All: "bg-[#956084] text-white",
  Pending: "bg-[#fce554] text-[#39265f]",
  Approved: "bg-[#67d953] text-[#39265f]",
  Rejected: "bg-[#f53c3d] text-white",
};

export default function MainContent() {
  const [activeTab, setActiveTab] = useState<TabOption>("All");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadRequests = async () => {
      setLoading(true);

      // Connect your Supabase query here when ready.
      // const { data: { user } } = await supabase.auth.getUser();
      // const { data, error } = await supabase
      //   .from("requests")
      //   .select("*")
      //   .eq("user_id", user?.id)
      //   .order("date", { ascending: false });
      //
      // if (error) {
      //   console.error(error.message);
      // } else if (active) {
      //   setRequests(data as RequestItem[]);
      // }

      await new Promise((resolve) => setTimeout(resolve, 200));

      if (active) {
        setRequests(MOCK_REQUESTS);
        setLoading(false);
      }
    };

    loadRequests();

    return () => {
      active = false;
    };
  }, []);

  const filteredRequests =
    activeTab === "All"
      ? requests
      : requests.filter((item) => item.status === activeTab);

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto bg-[#ffd9e8] p-4 md:p-8">
      {/* Faded campus logo background */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 h-0"
      >
        <div className="absolute left-0 top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <img
            src="/icons/request-bg.png"
            alt=""
            className="h-[90vh] w-auto max-w-none -translate-y-[4%] select-none opacity-25"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-[#39265f]">
            <Image
              src="/icons/request-icon.png"
              alt="My Requests"
              width={56}
              height={56}
              className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
            />

            <div>
              <h1
                className={`${delaGothicOne.className} text-3xl tracking-wide md:text-5xl`}
              >
                My Requests
              </h1>

              <p
                className="mt-1 text-sm tracking-widest text-[#6d5b7a]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                View and track your service requests
              </p>
            </div>
          </div>

          {/* New Request button */}
          <button
            type="button"
            onClick={() => {
              // Connect this button to your new request form or route.
              console.log("New request clicked");
            }}
            className={`${delaGothicOne.className} ${ACTION_BTN} self-start sm:self-auto`}
          >
            <Plus size={20} strokeWidth={3} />
            New Request
          </button>
        </div>

        {/* Decorative divider */}
        <div className="my-4 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />

          <div className="mx-4 flex gap-1 text-[#39265f]">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>

          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Status filters */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mb-6 md:gap-4">
          {(
            ["All", "Pending", "Approved", "Rejected"] as TabOption[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`${delaGothicOne.className} ${NAV_BTN} ${
                TAB_COLORS[tab]
              } ${
                activeTab === tab
                  ? "ring-2 ring-offset-2 ring-[#39265f]/30"
                  : ""
              }`}
            >
              {tab}
              <span className="ml-2">
                (
                {tab === "All"
                  ? requests.length
                  : requests.filter((item) => item.status === tab).length}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Request list */}
        {loading ? (
          <p className="py-8 text-center text-[#6d5b7a]">
            Loading requests...
          </p>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-lg border-2 border-[#c48ab2] bg-[#fbe6f0]/90 px-4 py-10 text-center shadow-sm">
            <FileText
              size={40}
              className="mx-auto mb-3 text-[#956084]"
              strokeWidth={1.5}
            />

            <p
              className="text-lg font-bold text-[#39265f]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              No {activeTab !== "All" ? activeTab.toLowerCase() : ""} requests
              yet.
            </p>

            <p className="mt-1 text-sm text-[#6d5b7a]">
              Your requests will appear here when you submit them.
            </p>
          </div>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pb-1 pr-1 sm:pr-2">
            {filteredRequests.map((item) => {
              const Icon = getIconForType(item.request_type);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    // Open the selected request's detail view here.
                    console.log("Selected request:", item.id);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border-2 border-[#c48ab2] bg-[#fbe6f0]/90 p-3 text-left shadow-sm transition hover:border-[#956084] hover:brightness-[0.98] active:scale-[0.99] sm:gap-4 sm:p-4"
                >
                  {/* Request icon and details */}
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className={ICON_BADGE}>
                      <Icon
                        size={24}
                        className="text-[#39265f] sm:h-7 sm:w-7"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <h3
                        className={`mb-1 break-words ${CARD_TITLE}`}
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>

                      <p className={`${CARD_TEXT} font-medium`}>
                        {item.office}
                      </p>

                      <p className={CARD_TEXT}>{item.date}</p>
                    </div>
                  </div>

                  {/* Status and arrow */}
                  <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <span
                      className={`${TAB_COLORS[item.status]} min-w-[84px] rounded-full px-3 py-1.5 text-center text-xs font-bold shadow-sm sm:min-w-[104px] sm:px-4 sm:text-sm`}
                    >
                      {item.status}
                    </span>

                    <ChevronRight
                      size={24}
                      strokeWidth={2.5}
                      className="shrink-0 text-[#6d5b7a] sm:h-7 sm:w-7"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}