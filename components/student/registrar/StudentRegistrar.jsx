"use client";

import { useState } from "react";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import NotificationsTab from "./NotificationsTab";
import OverviewTab from "./OverviewTab";
import RegistrarHeader from "./RegistrarHeader";
import RequestsTab from "./RequestsTab";
import SubjectsTab from "./SubjectsTab";
import {
  CLAIM_REQUIREMENTS,
  initialNotifications,
  initialRequests,
  initialSubjects,
} from "./data";

function StudentRegistrarTabs() {
  const [currentSubjects] = useState(initialSubjects);
  const [activeTab, setActiveTab] = useState("Overview");
  const [subjectRequests, setSubjectRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState(() =>
    initialNotifications.map((notification) => ({ ...notification, isRead: true })),
  );

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === "Notifications") {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({ ...notification, isRead: true })),
      );
    }
  }

  function createSubjectRequest(type, subject) {
    if (!subject) return;

    const hasPendingRequest = subjectRequests.some(
      (request) => request.subjectId === subject.id && request.status === "Pending",
    );
    if (hasPendingRequest) return;

    setSubjectRequests((currentRequests) => [
      {
        id: `request-${Date.now()}-${Math.random()}`,
        type,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        status: "Pending",
        dateSubmitted: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        dateReviewed: null,
      },
      ...currentRequests,
    ]);
  }

  function deleteNotification(notificationId) {
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId),
    );
  }

  function addNotification(message) {
    setNotifications((currentNotifications) => [
      {
        id: `notification-${Date.now()}-${Math.random()}`,
        message,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        isRead: false,
      },
      ...currentNotifications,
    ]);
  }

  function submitDocumentRequest(formData) {
    const hasPendingRequest = pendingRequests.some(
      (request) =>
        request.documentId === formData.document.id &&
        request.copyTypeId === (formData.copyOption?.id ?? null) &&
        request.status !== "Ready for claiming",
    );
    if (hasPendingRequest) return false;

    const request = {
      id: `document-request-${Date.now()}-${Math.random()}`,
      documentId: formData.document.id,
      copyTypeId: formData.copyOption?.id ?? null,
      copyFee: formData.copyOption?.fee ?? null,
      documentName: formData.copyOption
        ? `${formData.document.title} (${formData.copyOption.id === "ctc" ? "With CTC stamp" : formData.copyOption.label})`
        : formData.specifiedDocument,
      status: "Pending",
      purpose: formData.purpose,
      copies: formData.copies,
      claimDate: formData.claimDate,
      notes: formData.notes,
      submittedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setPendingRequests((currentRequests) => [request, ...currentRequests]);
    addNotification(`Your ${request.documentName} request is being processed.`);
    return true;
  }

  function advanceLatestRequest() {
    const latestRequest = pendingRequests[0];
    if (!latestRequest || latestRequest.status === "Ready for claiming") return;

    const status =
      latestRequest.status === "Pending" ? "Processing" : "Ready for claiming";
    setPendingRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === latestRequest.id ? { ...request, status } : request,
      ),
    );
    const message =
      status === "Processing"
        ? `Your ${latestRequest.documentName} request is being processed.`
        : `Your ${latestRequest.documentName} is ready for claiming. ${CLAIM_REQUIREMENTS}${
            latestRequest.copyFee > 0 ? " Pay the fee at the Cashier." : ""
          }`;
    addNotification(message);
  }

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <RegistrarHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="w-full max-w-5xl mx-auto mt-8 px-4 min-h-[400px]">
          {activeTab === "Overview" && (
            <OverviewTab
              notifications={notifications}
              currentSubjects={currentSubjects}
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === "Requests" && (
            <RequestsTab
              requests={initialRequests}
              pendingRequests={pendingRequests}
              onSubmitRequest={submitDocumentRequest}
              onAdvanceLatestRequest={advanceLatestRequest}
            />
          )}

          {activeTab === "Add/Remove Subjects" && (
            <SubjectsTab
              subjects={currentSubjects}
              pendingRequests={subjectRequests.filter((request) => request.status === "Pending")}
              onRequestSubject={(type, subject) => {
                createSubjectRequest(type, subject);
              }}
            />
          )}

          {activeTab === "Notifications" && (
            <NotificationsTab
              notifications={notifications}
              onDelete={deleteNotification}
              onClearAll={() => setNotifications([])}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function StudentRegistrar() {
  return (
    <UserProfileProvider>
      <StudentRegistrarTabs />
    </UserProfileProvider>
  );
}
