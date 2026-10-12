"use client";

import { useState } from "react";
import {
  LSC_CLAIM_NOTE,
  LSC_PAYMENT_NOTE,
  MOCK_PRINT_REQUESTS,
  REQUEST_STATUSES,
} from "./data";
import { computeBill } from "./utils";
import { UserProfileProvider } from "../../../contexts/UserProfileContext";
import AnnouncementsTab from "./AnnouncementsTab";
import MyRequestsTab from "./MyRequestsTab";
import OverviewTab from "./OverviewTab";
import LSCHeader from "./LSCHeader";
import ServicesTab from "./ServicesTab";
import { MOCK_ANNOUNCEMENTS } from "./data";

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function nextRequestNumber(requests, year) {
  const pattern = new RegExp(`^LSC-${year}-(\\d{5})$`);
  const nextSequence =
    requests.reduce((maximum, request) => {
      const match = request.requestNumber?.match(pattern);
      return match ? Math.max(maximum, Number(match[1])) : maximum;
    }, 0) + 1;

  return `LSC-${year}-${String(nextSequence).padStart(5, "0")}`;
}

export default function StudentLSC({ children }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [printRequests, setPrintRequests] = useState(MOCK_PRINT_REQUESTS);
  const [notifications, setNotifications] = useState([]);
  const [requestSequence, setRequestSequence] = useState(() => {
    const year = new Date().getFullYear();
    return {
      year,
      next: Number(nextRequestNumber(MOCK_PRINT_REQUESTS, year).slice(-5)),
    };
  });

  // TODO: When file uploads are implemented, store files in a private Supabase Storage bucket with Row Level Security so a student can access only their own files.
  function addPrintRequest(request) {
    const year = new Date().getFullYear();
    const sequence =
      requestSequence.year === year
        ? requestSequence.next
        : Number(nextRequestNumber(printRequests, year).slice(-5));
    setRequestSequence({ year, next: sequence + 1 });
    const printRequest = {
      id: `lsc-request-${globalThis.crypto.randomUUID()}`,
      requestNumber: `LSC-${year}-${String(sequence).padStart(5, "0")}`,
      fileNames: Array.isArray(request.fileNames) ? [...request.fileNames] : [],
      paperSize: request.paperSize,
      color: request.color,
      layout: request.layout,
      pages: Number(request.pages) || 0,
      additionalRequest: request.additionalRequest ?? "",
      totalBill: computeBill(request.paperSize, request.color, request.pages),
      status: "Pending",
      dateSubmitted: request.dateSubmitted ?? formatDate(new Date()),
    };

    setPrintRequests((currentRequests) => [...currentRequests, printRequest]);
    return printRequest;
  }

  function cancelPrintRequest(requestId) {
    setPrintRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status: "Cancelled" } : request,
      ),
    );
  }

  function updatePrintRequestStatus(requestId, status) {
    if (!REQUEST_STATUSES.includes(status)) {
      throw new Error(`Invalid print request status: ${status}`);
    }

    const existingRequest = printRequests.find(
      (request) => request.id === requestId,
    );
    if (!existingRequest || existingRequest.status === status) return;

    setPrintRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status } : request,
      ),
    );

    if (status === "Ready for claiming") {
      setNotifications((currentNotifications) => [
        {
          id: `lsc-ready-${requestId}-${Date.now()}`,
          title: "Print request ready for claiming",
          message: `Your print request ${existingRequest.requestNumber} is ready for claiming. ${LSC_CLAIM_NOTE} ${LSC_PAYMENT_NOTE}`,
          date: formatDate(new Date()),
          read: false,
        },
        ...currentNotifications,
      ]);
    }
  }

  const sharedState = {
    activeTab,
    onTabChange: setActiveTab,
    printRequests,
    addPrintRequest,
    cancelPrintRequest,
    updatePrintRequestStatus,
    notifications,
  };

  const tabContent = typeof children === "function"
    ? children(sharedState)
    : activeTab === "overview"
      ? (
        <UserProfileProvider>
          <OverviewTab
            printRequests={printRequests}
            announcements={MOCK_ANNOUNCEMENTS}
            onNavigate={setActiveTab}
          />
        </UserProfileProvider>
      )
      : activeTab === "services"
        ? (
          <ServicesTab
            printRequests={printRequests}
            addPrintRequest={addPrintRequest}
          />
        )
        : activeTab === "myRequests"
          ? (
            <MyRequestsTab
              printRequests={printRequests}
              cancelPrintRequest={cancelPrintRequest}
              updatePrintRequestStatus={updatePrintRequestStatus}
              onNavigate={setActiveTab}
            />
          )
          : <AnnouncementsTab />;

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <LSCHeader activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mx-auto mt-8 min-h-[400px] w-full max-w-5xl px-4">
          {tabContent}
        </div>
      </div>
    </main>
  );
}
