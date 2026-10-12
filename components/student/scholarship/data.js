function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function submittedDate(daysAgo) {
  return dateOffset(-daysAgo);
}

export const APPLICATION_ID_PREFIX = "CVLB";

export function parseDisplayDate(value) {
  const match = value.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return new Date(value);

  return new Date(`${match[1]} ${Number(match[2])}, ${match[3]} 00:00:00`);
}

function defaultDocuments() {
  return [
    "Certificate of Registration",
    "Report of Grades",
    "Valid ID or Student ID",
  ];
}

// TODO: Replace with data from the admin/Supabase.
export const MOCK_SCHOLARSHIPS = [
  {
    id: "academic-scholarship",
    name: "Academic Scholarship",
    description: "For deserving and qualified students.",
    about:
      "The Academic Scholarship recognizes students who demonstrate strong academic performance and commitment to their studies.",
    eligibility: [
      "Must be currently enrolled at the college.",
      "Must meet the scholarship GPA requirement.",
      "Must submit all required documents before the deadline.",
    ],
    benefits: [
      "Tuition assistance based on scholarship approval.",
      "Recognition as an academic scholar.",
    ],
    applicationStart: dateOffset(-30),
    applicationEnd: dateOffset(14),
    requiredDocuments: defaultDocuments(),
    requiresGpa: true,
    maxGpa: 2.0,
    deadline: dateOffset(14),
    status: "Open",
  },
  {
    id: "financial-assistance-program",
    name: "Financial Assistance Program",
    description: "For students with financial difficulties.",
    about:
      "The Financial Assistance Program supports eligible students who need assistance to continue their education.",
    eligibility: [
      "Must be currently enrolled at the college.",
      "Must submit the required supporting documents.",
    ],
    benefits: [
      "Financial assistance subject to review and approval.",
      "Support to help continue academic studies.",
    ],
    applicationStart: dateOffset(-30),
    applicationEnd: dateOffset(21),
    requiredDocuments: defaultDocuments(),
    requiresGpa: false,
    maxGpa: null,
    deadline: dateOffset(21),
    status: "Open",
  },
  {
    id: "student-leadership-grant",
    name: "Student Leadership Grant",
    description: "Support for students demonstrating campus leadership.",
    about:
      "The Student Leadership Grant recognizes students who contribute to campus life through leadership and service.",
    eligibility: [
      "Must be currently enrolled at the college.",
      "Must demonstrate campus leadership or service.",
    ],
    benefits: [
      "Grant support subject to scholarship approval.",
      "Recognition of campus leadership and service.",
    ],
    applicationStart: dateOffset(-30),
    applicationEnd: dateOffset(30),
    requiredDocuments: defaultDocuments(),
    requiresGpa: false,
    maxGpa: null,
    deadline: dateOffset(30),
    status: "Open",
  },
];

export const MOCK_APPLICATIONS = [
  {
    id: "application-academic",
    applicationId: "CVLB-2026-00001",
    scholarshipId: "academic-scholarship",
    scholarshipName: "Academic Scholarship",
    status: "Rejected",
    remarks: "Incomplete supporting documents.",
    dateSubmitted: submittedDate(2),
  },
  {
    id: "application-financial-assistance",
    applicationId: "CVLB-2026-00002",
    scholarshipId: "financial-assistance-program",
    scholarshipName: "Financial Assistance Program",
    status: "Approved",
    remarks: "",
    dateSubmitted: submittedDate(4),
  },
  {
    id: "application-leadership",
    applicationId: "CVLB-2026-00003",
    scholarshipId: "student-leadership-grant",
    scholarshipName: "Student Leadership Grant",
    status: "Pending",
    remarks: "",
    dateSubmitted: submittedDate(1),
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "academic-application-update",
    title: "Application update",
    message: "Your Academic Scholarship application was rejected.",
    date: submittedDate(2),
    read: false,
  },
  {
    id: "financial-application-approved",
    title: "Application approved",
    message:
      "Congratulations! Your Financial Assistance Program application has been approved.",
    date: submittedDate(4),
    read: false,
  },
  {
    id: "leadership-application-received",
    title: "Application received",
    message: "Your Student Leadership Grant application is pending review.",
    date: submittedDate(1),
    read: true,
  },
];
