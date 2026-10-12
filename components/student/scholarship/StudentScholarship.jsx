"use client";

import { useState } from "react";
import { UserProfileProvider } from "../../../contexts/UserProfileContext";
import {
  APPLICATION_ID_PREFIX,
  MOCK_APPLICATIONS,
  MOCK_NOTIFICATIONS,
  MOCK_SCHOLARSHIPS,
} from "./data";
import MyApplicationsTab from "./MyApplicationsTab";
import OverviewTab from "./OverviewTab";
import ScholarshipListTab from "./ScholarshipListTab";
import ScholarshipHeader from "./ScholarshipHeader";

const tabLabels = {
  scholarshipList: "Scholarship List",
  myApplications: "My Applications",
  notifications: "Notifications",
};

function ComingSoonTab({ title }) {
  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-8 text-center text-[#48305d] shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2">Coming soon</p>
    </section>
  );
}

function StudentScholarshipContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [scholarships] = useState(MOCK_SCHOLARSHIPS);

  function addApplication(applicationData) {
    const { scholarship, ...applicationFields } = applicationData;
    const alreadyApplied = applications.some(
      (application) =>
        application.scholarshipId === scholarship.id &&
        ["Pending", "Approved"].includes(application.status),
    );
    if (alreadyApplied) return null;

    const year = new Date().getFullYear();
    const applicationIdPattern = new RegExp(
      `^${APPLICATION_ID_PREFIX}-${year}-(\\d{5})$`,
    );
    const nextNumber =
      applications.reduce((maximum, application) => {
        const match = application.applicationId?.match(applicationIdPattern);
        return match ? Math.max(maximum, Number(match[1])) : maximum;
      }, 0) + 1;
    const application = {
      ...applicationFields,
      id: `application-${globalThis.crypto.randomUUID()}`,
      applicationId: `${APPLICATION_ID_PREFIX}-${year}-${String(nextNumber).padStart(5, "0")}`,
      scholarshipId: scholarship.id,
      scholarshipName: scholarship.name,
      status: "Pending",
      remarks: "",
    };
    setApplications((currentApplications) => [
      ...currentApplications,
      application,
    ]);
    return application;
  }

  function updateApplicationStatus(applicationId, status, remarks = "") {
    const application = applications.find((item) => item.id === applicationId);
    if (!application || application.status !== "Pending") return;

    setApplications((currentApplications) =>
      currentApplications.map((item) =>
        item.id === applicationId ? { ...item, status, remarks } : item,
      ),
    );
    const decisionMessage =
      status === "Approved"
        ? `Your ${application.scholarshipName} application has been approved.`
        : `Your ${application.scholarshipName} application was rejected. Reason: ${remarks}`;
    setNotifications((currentNotifications) => [
      {
        id: `application-status-${applicationId}-${Date.now()}`,
        title: `Application ${status}: ${application.scholarshipName}`,
        message: decisionMessage,
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "2-digit",
          year: "numeric",
        }),
        read: false,
      },
      ...currentNotifications,
    ]);
  }

  function addNotification(notification) {
    setNotifications((currentNotifications) => [
      notification,
      ...currentNotifications,
    ]);
  }

  function deleteNotification(notificationId) {
    setNotifications((currentNotifications) =>
      currentNotifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
  }

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <ScholarshipHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="mx-auto mt-8 min-h-[400px] w-full max-w-5xl px-4">
          {activeTab === "overview" ? (
            <OverviewTab
              scholarships={scholarships}
              applications={applications}
              onNavigate={setActiveTab}
            />
          ) : activeTab === "scholarshipList" ? (
            <ScholarshipListTab
              scholarships={scholarships}
              applications={applications}
              addApplication={addApplication}
              addNotification={addNotification}
              onNavigate={setActiveTab}
            />
          ) : activeTab === "myApplications" ? (
            <MyApplicationsTab
              applications={applications}
              onNavigate={setActiveTab}
              onUpdateStatus={updateApplicationStatus}
            />
          ) : activeTab === "notifications" ? (
            <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#48305d]">
                  Notifications
                </h2>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNotifications([])}
                    className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da]"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {notifications.length > 0 ? (
                <ul className="space-y-2">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`flex items-start gap-3 rounded-md p-3 text-[#392641] ${
                        notification.read
                          ? "bg-[#e8c3da]"
                          : "bg-[#c58eb4] ring-2 ring-[#87577d]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{notification.title}</p>
                        <p className="mt-1 text-sm">{notification.message}</p>
                        <p className="mt-1 text-xs text-[#684f6c]">
                          {notification.date}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Delete notification"
                        onClick={() => deleteNotification(notification.id)}
                        className="rounded-full p-2 text-[#765f7a] transition hover:bg-red-100 hover:text-red-600"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-[#684f6c]">
                  No notifications yet.
                </p>
              )}
            </section>
          ) : (
            <ComingSoonTab title={tabLabels[activeTab]} />
          )}
        </div>
      </div>
    </main>
  );
}

export default function StudentScholarship() {
  return (
    <UserProfileProvider>
      <StudentScholarshipContent />
    </UserProfileProvider>
  );
}
