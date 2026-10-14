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
          <div className="flex items-center gap-3 text-[#39265f] md:gap-4">
            <Image
              src="/icons/request-icon.png"
              alt="Notification"
              width={45}
              height={45}
              className="h-13 w-13 object-contain sm:h-14 sm:w-14"
            />

            <div>
              <h1
                className={`${delaGothicOne.className} text-2xl tracking-wide sm:text-3xl md:text-4xl xl:text-5xl`}
              >
                My Requests
              </h1>

              <p
                className="mt-1 text-xs tracking-wide text-[#6d5b7a] sm:text-sm md:tracking-widest"
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
            className="flex items-center justify-center gap-2 self-start rounded-xl border border-[#39265f]/30 bg-[#956084] px-5 py-3 font-bold text-white shadow-md transition hover:bg-[#80506f] active:scale-95 sm:self-auto"
          >
            <Plus size={20} strokeWidth={3} />
            New Request
          </button>
        </div>

        {/* Decorative divider */}
        <div className="my-5 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />

          <div className="mx-3 flex gap-1 text-[#39265f] md:mx-4">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>

          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Status filters */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mb-8 md:gap-4">
          {(
            ["All", "Pending", "Approved", "Rejected"] as TabOption[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`${delaGothicOne.className} rounded-xl px-3 py-3 text-xs shadow-sm transition hover:brightness-105 active:scale-95 sm:text-sm md:py-4 ${
                TAB_COLORS[tab]
              } ${
                activeTab === tab
                  ? "ring-2 ring-[#39265f]/40 ring-offset-2 ring-offset-[#ffd9e8]"
                  : "opacity-90"
              }`}
            >
              {tab}
              <span className="ml-2 font-sans text-xs">
                {tab === "All"
                  ? requests.length
                  : requests.filter((item) => item.status === tab).length}
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
          <div className="rounded-xl border border-[#c48ab2] bg-[#dfb5d1]/70 px-4 py-10 text-center shadow-sm">
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
          <div className="flex flex-col gap-3 pb-8 md:gap-4">
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
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#c48ab2] bg-gradient-to-r from-[#dfb5d1]/90 via-[#d4a9c8]/85 to-[#a991b8]/85 p-3 text-left shadow-sm transition duration-200 hover:border-[#956084] hover:shadow-md active:scale-[0.99] sm:p-4 md:gap-5"
                >
                  {/* Request icon and details */}
                  <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-[#b477a1] to-[#6d5b7a] shadow-inner sm:h-14 sm:w-14">
                      <Icon
                        size={25}
                        strokeWidth={1.8}
                        className="text-white sm:h-7 sm:w-7"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <h3
                        className="mb-0.5 break-words text-base font-bold text-[#39265f] sm:text-lg md:text-xl"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>

                      <p className="text-xs font-medium text-[#5a4a75] sm:text-sm">
                        {item.office}
                      </p>

                      <p className="text-xs text-[#5a4a75] sm:text-sm">
                        {item.date}
                      </p>
                    </div>
                  </div>

                  {/* Status and arrow */}
                  <div className="flex shrink-0 items-center gap-2 sm:gap-4 md:gap-5">
                    <span
                      className={`${TAB_COLORS[item.status]} min-w-[76px] rounded-full px-2 py-1 text-center text-[10px] font-bold shadow-sm sm:min-w-[100px] sm:px-4 sm:py-1.5 sm:text-xs`}
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
      </div>
    </div>
  );
}