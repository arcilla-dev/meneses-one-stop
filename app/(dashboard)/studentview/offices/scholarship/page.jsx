"use client";

import { useState, useMemo } from "react";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  Clock3,
  FileCheck2,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  Search,
} from "lucide-react";
import { registrarDisplayFont } from "@/components/student/registrar/fonts";
import {
  APPLICATION_ID_PREFIX,
  MOCK_APPLICATIONS,
  MOCK_NOTIFICATIONS,
  MOCK_SCHOLARSHIPS,
  parseDisplayDate,
} from "@/components/student/scholarship/data";
import ApplicationItem from "@/components/student/scholarship/ApplicationItem";
import ApplicationForm from "@/components/student/scholarship/views/ApplicationForm";
import ApplicationSubmitted from "@/components/student/scholarship/views/ApplicationSubmitted";
import ScholarshipCard from "@/components/student/scholarship/ScholarshipCard";

const tabLabels = {
  scholarshipList: "Scholarship List",
  myApplications: "My Applications",
  notifications: "Notifications",
};

const scholarshipTabs = [
  { key: "overview", label: "Overview" },
  { key: "scholarshipList", label: "Scholarship List" },
  { key: "myApplications", label: "My Applications" },
  { key: "notifications", label: "Notifications" },
];

const profileFields = [
  ["Name", "full_name"],
  ["Student ID", "student_number"],
  ["Program", "program"],
  ["Year & Section", "year_section"],
];

const applicationFilters = ["All", "Pending", "Approved", "Rejected"];
const scholarshipFilters = ["All", "Open", "Closed"];

function dayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isApplicationPeriodOpen(scholarship) {
  const today = dayStart(new Date());
  const start = dayStart(parseDisplayDate(scholarship.applicationStart));
  const end = dayStart(parseDisplayDate(scholarship.applicationEnd));

  return today >= start && today <= end;
}

function daysUntil(value) {
  const deadline = parseDisplayDate(value);
  const today = new Date();

  const deadlineDay = Date.UTC(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate(),
  );

  const todayDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.max(
    0,
    Math.round((deadlineDay - todayDay) / 86_400_000),
  );
}

export default function ScholarshipPage() {
    const { studentProfile, loading } = useUserProfile();

  // Shared state
  const [activeTab, setActiveTab] = useState("overview");
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [scholarships] = useState(MOCK_SCHOLARSHIPS);

  // My Applications tab state
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("All");

  // Scholarship List tab state
  const [search, setSearch] = useState("");
  const [scholarshipStatusFilter, setScholarshipStatusFilter] = useState("All");
  const [listView, setListView] = useState("list");
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [submittedApplication, setSubmittedApplication] = useState(null);

  // Overview derived data
  const openScholarships = scholarships.filter(
    (scholarship) => scholarship.status === "Open",
  );

  const pendingApplications = applications.filter(
    (application) => application.status === "Pending",
  ).length;

  const latestDecision = applications
    .filter((application) =>
      ["Approved", "Rejected"].includes(application.status),
    )
    .sort(
      (first, second) =>
        parseDisplayDate(second.dateSubmitted).getTime() -
        parseDisplayDate(first.dateSubmitted).getTime(),
    )[0];

  const nextDeadline = [...openScholarships].sort(
    (first, second) =>
      parseDisplayDate(first.deadline).getTime() -
      parseDisplayDate(second.deadline).getTime(),
  )[0];

  const stats = [
    {
      label: "Available Scholarships",
      value: openScholarships.length,
      tab: "scholarshipList",
      icon: GraduationCap,
    },
    {
      label: "My Applications",
      value: applications.length,
      tab: "myApplications",
      icon: FileCheck2,
    },
    {
      label: "Pending Applications",
      value: pendingApplications,
      tab: "myApplications",
      icon: Clock3,
    },
  ];

  // My Applications derived data
  const applicationCounts = {
    All: applications.length,
    Pending: applications.filter(
      (application) => application.status === "Pending",
    ).length,
    Approved: applications.filter(
      (application) => application.status === "Approved",
    ).length,
    Rejected: applications.filter(
      (application) => application.status === "Rejected",
    ).length,
  };

  const visibleApplications = useMemo(
    () =>
      applications
        .filter(
          (application) =>
            applicationStatusFilter === "All" ||
            application.status === applicationStatusFilter,
        )
        .sort(
          (first, second) =>
            parseDisplayDate(second.dateSubmitted).getTime() -
            parseDisplayDate(first.dateSubmitted).getTime(),
        ),
    [applicationStatusFilter, applications],
  );

  // Scholarship List derived data
  const scholarshipCounts = {
    All: scholarships.length,
    Open: scholarships.filter(
      (scholarship) => scholarship.status === "Open",
    ).length,
    Closed: scholarships.filter(
      (scholarship) => scholarship.status === "Closed",
    ).length,
  };

  const visibleScholarships = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return scholarships.filter((scholarship) => {
      const matchesFilter =
        scholarshipStatusFilter === "All" ||
        scholarship.status === scholarshipStatusFilter;

      const matchesSearch = scholarship.name
        .toLocaleLowerCase()
        .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [scholarshipStatusFilter, scholarships, search]);

  // Scholarship details derived data
  const selectedAlreadyApplied = selectedScholarship
    ? applications.some(
        (application) =>
          application.scholarshipId === selectedScholarship.id &&
          ["Pending", "Approved"].includes(application.status),
      )
    : false;

  const selectedCanApply = selectedScholarship
    ? selectedScholarship.status === "Open" &&
      isApplicationPeriodOpen(selectedScholarship) &&
      !selectedAlreadyApplied
    : false;

  // Tab-local state used to be discarded when a tab unmounted.
  // Reset it on tab change to preserve that behavior.
  function changeTab(tab) {
    if (tab === activeTab) return;

    setActiveTab(tab);
    setApplicationStatusFilter("All");
    setSearch("");
    setScholarshipStatusFilter("All");
    setListView("list");
    setSelectedScholarship(null);
    setSubmittedApplication(null);
  }

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
        const match = application.applicationId?.match(
          applicationIdPattern,
        );

        return match
          ? Math.max(maximum, Number(match[1]))
          : maximum;
      }, 0) + 1;

    const application = {
      ...applicationFields,
      id: `application-${globalThis.crypto.randomUUID()}`,
      applicationId: `${APPLICATION_ID_PREFIX}-${year}-${String(
        nextNumber,
      ).padStart(5, "0")}`,
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

  function updateApplicationStatus(
    applicationId,
    status,
    remarks = "",
  ) {
    const application = applications.find(
      (item) => item.id === applicationId,
    );

    if (!application || application.status !== "Pending") {
      return;
    }

    setApplications((currentApplications) =>
      currentApplications.map((item) =>
        item.id === applicationId
          ? { ...item, status, remarks }
          : item,
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

  function clearAllNotifications() {
    setNotifications([]);
  }
  return (
    <UserProfileProvider>
      <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
          {/* Header */}
          <section className="relative isolate overflow-hidden rounded-xl bg-[#33213f] px-4 py-2 text-[#fff0f8] shadow-sm sm:px-5">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-20 bg-[url('/campus-bg.png')] bg-cover bg-[center_44%]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-r from-[#392542]/95 via-[#482b46]/85 to-[#351f38]/95"
            />
            <div className="flex items-center gap-4">
              <GraduationCap
                className="h-9 w-9 shrink-0 text-[#d59bc1]"
                strokeWidth={1.8}
              />
              <div>
                <h1
                  className={`${registrarDisplayFont.className} text-[clamp(1.8rem,4vw,2.65rem)] leading-none tracking-tight`}
                >
                  Scholarship
                </h1>
                <p className="mt-1 text-xs font-semibold text-[#f5d8e9] sm:text-sm">
                  Explore scholarship opportunities and track your applications.
                </p>
              </div>
            </div>

            <div className="my-1.5 flex items-center gap-2" aria-hidden="true">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d699c0] to-[#d699c0]" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[#d699c0]" />
              <span className="h-px flex-1 bg-gradient-to-r from-[#d699c0] via-[#d699c0] to-transparent" />
            </div>

            <nav
              aria-label="Scholarship sections"
              className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1.2fr_1.2fr_1fr]"
            >
              {scholarshipTabs.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeTab(key)}
                  aria-current={activeTab === key ? "page" : undefined}
                  className={`rounded-md px-2 py-1 text-center font-sans text-[11px] font-bold transition-colors sm:text-xs ${
                    activeTab === key
                      ? "bg-[#c58bb1] text-white shadow-inner"
                      : "bg-[#d8a6c7] text-white hover:bg-[#c58bb1]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </section>

          <div className="mx-auto mt-8 min-h-[400px] w-full max-w-5xl px-4">
            {activeTab === "overview" ? (
              /* Overview */
              <div className="mb-8 flex w-full flex-col gap-6">
                <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
                  <h2
                    className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
                  >
                    Student Information
                  </h2>

                  {loading ? (
                    <div
                      aria-label="Loading student information"
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      {profileFields.map(([label]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3"
                        >
                          <span className="text-sm font-semibold">{label}</span>
                          <span className="h-4 w-36 animate-pulse rounded bg-[#d8afcc]" />
                        </div>
                      ))}
                    </div>
                  ) : !studentProfile ? (
                    <p className="text-sm text-[#684f6c]">
                      Sign in to see your information.
                    </p>
                  ) : (
                    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      {profileFields.map(([label, field]) => {
                        const value = studentProfile[field];

                        return (
                          <div
                            key={field}
                            className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3"
                          >
                            <dt className="text-sm font-semibold">{label}</dt>
                            <dd className="text-right text-sm">
                              {value == null || value === "" ? "—" : value}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                </section>

                <section
                  aria-label="Scholarship statistics"
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {stats.map(({ label, value, tab, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => changeTab(tab)}
                      className="flex items-center gap-4 rounded-md border border-[#956887] bg-[#e8c3da] p-6 text-left text-[#48305d] shadow-sm transition-colors hover:bg-[#d8a6c7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
                    >
                      <Icon
                        className="h-8 w-8 shrink-0 text-[#8c6895]"
                        aria-hidden="true"
                      />

                      <span>
                        <span className="block text-3xl font-bold leading-none">
                          {value}
                        </span>
                        <span className="mt-1 block text-sm font-semibold">
                          {label}
                        </span>
                      </span>
                    </button>
                  ))}
                </section>

                {latestDecision && (
                  <section
                    role="status"
                    className={`rounded-md border p-6 shadow-sm ${
                      latestDecision.status === "Approved"
                        ? "border-green-300 bg-green-50 text-green-900"
                        : "border-red-300 bg-red-50 text-red-800"
                    }`}
                  >
                    {latestDecision.status === "Approved" ? (
                      <p className="font-semibold">
                        Congratulations! Your {latestDecision.scholarshipName}{" "}
                        application has been approved.
                      </p>
                    ) : (
                      <p className="font-semibold">
                        Your {latestDecision.scholarshipName} application was
                        rejected.
                        {latestDecision.remarks
                          ? ` Reason: ${latestDecision.remarks}`
                          : ""}
                      </p>
                    )}
                  </section>
                )}

                <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2
                      className={`${registrarDisplayFont.className} text-2xl leading-tight text-[#48305d]`}
                    >
                      Next deadline
                    </h2>

                    {nextDeadline && (
                      <span className="rounded-full bg-[#e8c3da] px-3 py-1 text-xs font-bold text-[#684f6c]">
                        {daysUntil(nextDeadline.deadline)} days left
                      </span>
                    )}
                  </div>

                  {nextDeadline ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#e8c3da] p-4">
                      <div>
                        <p className="font-bold">{nextDeadline.name}</p>
                        <p className="mt-1 text-sm text-[#684f6c]">
                          Deadline: {nextDeadline.deadline}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => changeTab("scholarshipList")}
                        className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#d8a6c7] hover:text-[#48305d]"
                      >
                        View Details
                      </button>
                    </div>
                  ) : (
                    <p className="py-4 text-sm text-[#684f6c]">
                      No open scholarships right now.
                    </p>
                  )}
                </section>

                <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
                  <h2
                    className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
                  >
                    Quick Actions
                  </h2>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { label: "Browse Scholarships", tab: "scholarshipList" },
                      { label: "My Applications", tab: "myApplications" },
                    ].map(({ label, tab }) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => changeTab(tab)}
                        className="rounded-md bg-[#d8a6c7] px-4 py-3 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : activeTab === "scholarshipList" ? (
              /* Scholarship List: details / form / submitted / list */
              listView === "details" && selectedScholarship ? (
                <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
                  <button
                    type="button"
                    onClick={() => setListView("list")}
                    className="mb-5 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Scholarship List
                  </button>

                  <h2
                    className={`${registrarDisplayFont.className} mb-6 text-center text-2xl leading-tight text-[#48305d]`}
                  >
                    {selectedScholarship.name}
                  </h2>

                  <div className="space-y-5">
                    <section>
                      <h3 className="font-bold text-[#48305d]">
                        About the Scholarship
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#684f6c]">
                        {selectedScholarship.about}
                      </p>
                    </section>

                    <section>
                      <h3 className="font-bold text-[#48305d]">Eligibility</h3>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#684f6c]">
                        {selectedScholarship.eligibility.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h3 className="font-bold text-[#48305d]">Benefits</h3>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#684f6c]">
                        {selectedScholarship.benefits.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h3 className="font-bold text-[#48305d]">
                        Application Period
                      </h3>
                      <p className="mt-1 text-sm text-[#684f6c]">
                        {selectedScholarship.applicationStart} to{" "}
                        {selectedScholarship.applicationEnd}
                      </p>
                    </section>

                    <section>
                      <h3 className="font-bold text-[#48305d]">
                        Required Documents
                      </h3>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#684f6c]">
                        {selectedScholarship.requiredDocuments.map(
                          (documentName) => (
                            <li key={documentName}>{documentName}</li>
                          ),
                        )}
                      </ul>
                    </section>
                  </div>

                  <div className="mt-7 flex flex-col items-center">
                    <button
                      type="button"
                      disabled={!selectedCanApply}
                      onClick={() => setListView("form")}
                      className="rounded-md bg-[#87577d] px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#68466f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
                    >
                      APPLY FOR SCHOLARSHIP
                    </button>

                    {selectedAlreadyApplied ? (
                      <p className="mt-2 text-sm text-[#684f6c]">
                        <CheckCircle2
                          className="mr-1 inline h-4 w-4"
                          aria-hidden="true"
                        />
                        You already applied for this scholarship.
                      </p>
                    ) : !selectedCanApply ? (
                      <p className="mt-2 text-sm text-[#684f6c]">
                        Applications are closed.
                      </p>
                    ) : null}
                  </div>
                </section>
              ) : listView === "form" && selectedScholarship ? (
                <ApplicationForm
                  scholarship={selectedScholarship}
                  onCancel={() => setListView("details")}
                  onSubmitted={(application) => {
                    setSubmittedApplication(application);
                    setListView("submitted");
                  }}
                  onSubmitApplication={addApplication}
                  onAddNotification={addNotification}
                />
              ) : listView === "submitted" &&
                selectedScholarship &&
                submittedApplication ? (
                <ApplicationSubmitted
                  scholarship={selectedScholarship}
                  application={submittedApplication}
                  onNavigate={changeTab}
                  onBackToList={() => {
                    setSelectedScholarship(null);
                    setSubmittedApplication(null);
                    setListView("list");
                  }}
                />
              ) : (
                <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
                  <h2
                    className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
                  >
                    Scholarship List
                  </h2>

                  <label className="mb-4 flex items-center gap-2 rounded-md border border-[#c99fbd] bg-white/70 px-3 py-2 text-[#684f6c] focus-within:ring-2 focus-within:ring-[#87577d]">
                    <Search
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />

                    <span className="sr-only">
                      Search scholarships by name
                    </span>

                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search scholarships"
                      className="min-w-0 flex-1 bg-transparent text-sm text-[#392641] outline-none placeholder:text-[#8f7890]"
                    />
                  </label>

                  <div
                    aria-label="Filter scholarships"
                    className="mb-5 flex flex-wrap gap-2"
                  >
                    {scholarshipFilters.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        aria-pressed={scholarshipStatusFilter === filter}
                        onClick={() => setScholarshipStatusFilter(filter)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                          scholarshipStatusFilter === filter
                            ? "bg-[#87577d] text-white"
                            : "bg-[#e8c3da] text-[#684f6c] hover:bg-[#d8a6c7]"
                        }`}
                      >
                        {filter} ({scholarshipCounts[filter]})
                      </button>
                    ))}
                  </div>

                  {visibleScholarships.length > 0 ? (
                    <ul className="space-y-3">
                      {visibleScholarships.map((scholarship) => (
                        <ScholarshipCard
                          key={scholarship.id}
                          scholarship={scholarship}
                          onViewDetails={(item) => {
                            setSelectedScholarship(item);
                            setListView("details");
                          }}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="py-10 text-center text-sm text-[#684f6c]">
                      No scholarships found.
                    </p>
                  )}
                </section>
              )
            ) : activeTab === "myApplications" ? (
              /* My Applications */
              <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
                <h2
                  className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
                >
                  My Applications
                </h2>

                <div
                  aria-label="Filter applications"
                  className="mb-5 flex flex-wrap gap-2"
                >
                  {applicationFilters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      aria-pressed={applicationStatusFilter === filter}
                      onClick={() => setApplicationStatusFilter(filter)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        applicationStatusFilter === filter
                          ? "bg-[#87577d] text-white"
                          : "bg-[#e8c3da] text-[#684f6c] hover:bg-[#d8a6c7]"
                      }`}
                    >
                      {filter} ({applicationCounts[filter]})
                    </button>
                  ))}
                </div>

                {visibleApplications.length > 0 ? (
                  <ul className="space-y-3">
                    {visibleApplications.map((application) => (
                      <ApplicationItem
                        key={application.id}
                        application={application}
                        onUpdateStatus={updateApplicationStatus}
                      />
                    ))}
                  </ul>
                ) : applications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#684f6c]">
                    <p>You have no applications yet.</p>

                    <button
                      type="button"
                      onClick={() => changeTab("scholarshipList")}
                      className="mt-2 rounded-md bg-[#d8a6c7] px-3 py-1.5 font-semibold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
                    >
                      Browse Scholarships
                    </button>
                  </div>
                ) : (
                  <p className="py-10 text-center text-sm text-[#684f6c]">
                    No {applicationStatusFilter.toLowerCase()} applications.
                  </p>
                )}
              </section>
            ) : activeTab === "notifications" ? (
              /* Notifications */
              <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#48305d]">
                    Notifications
                  </h2>

                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
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
              /* Coming soon */
              <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-8 text-center text-[#48305d] shadow-sm">
                <h2 className="text-lg font-semibold">
                  {tabLabels[activeTab] ?? activeTab}
                </h2>
                <p className="mt-2">Coming soon</p>
              </section>
            )}
          </div>
        </div>
      </main>
    </UserProfileProvider>
  );
}
