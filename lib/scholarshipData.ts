import { isoDaysFromNow } from './scholarshipUtils';

/* ---------- types ---------- */

export type ScholarshipStatus = 'Open' | 'Closed';
export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export type Scholarship = {
  id: string;
  name: string;
  description: string;
  about: string;
  eligibility: string[];
  benefits: string[];
  applicationStart: string; // ISO
  applicationEnd: string; // ISO
  requiredDocuments: string[];
  requiresGpa: boolean;
  maxGpa: number | null; // student's GPA must be <= this (1.00 is best)
  deadline: string; // ISO
  status: ScholarshipStatus;
};

export type Application = {
  id: string;
  applicationId: string;
  scholarshipId: string;
  scholarshipName: string;
  status: ApplicationStatus;
  remarks: string;
  dateSubmitted: string; // ISO
  contact?: { email: string; phone: string };
  documents?: string[]; // file names (TODO: storage paths)
  gpa?: string;
};

/** What the Application form hands to the page (real File objects, so the page can upload them) */
export type ApplicationDraft = {
  scholarship: Scholarship;
  contact: { email: string; phone: string };
  gpa?: string;
  files: Record<string, File>; // keyed by required document name
};

export type ScholarshipNotification = {
  id: string;
  title: string;
  message: string;
  date: string; // ISO
  read: boolean;
};

/* ---------- constants ---------- */

export const APPLICATION_ID_PREFIX = 'CVLB';

export const applicationStatusStyles: Record<ApplicationStatus, string> = {
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-700',
};

export const scholarshipStatusStyles: Record<ScholarshipStatus, string> = {
  Open: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-700',
};

/* ---------- mock data (replace with Supabase queries) ---------- */

const defaultDocuments = ['Certificate of Registration', 'Report of Grades', 'Valid ID or Student ID'];

// TODO: Replace with data from the admin/Supabase.
export const MOCK_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'academic-scholarship',
    name: 'Academic Scholarship',
    description: 'For deserving and qualified students.',
    about: 'The Academic Scholarship recognizes students who demonstrate strong academic performance and commitment to their studies.',
    eligibility: [
      'Must be currently enrolled at the college.',
      'Must meet the scholarship GPA requirement.',
      'Must submit all required documents before the deadline.',
    ],
    benefits: ['Tuition assistance based on scholarship approval.', 'Recognition as an academic scholar.'],
    applicationStart: isoDaysFromNow(-30),
    applicationEnd: isoDaysFromNow(14),
    requiredDocuments: defaultDocuments,
    requiresGpa: true,
    maxGpa: 2.0,
    deadline: isoDaysFromNow(14),
    status: 'Open',
  },
  {
    id: 'financial-assistance-program',
    name: 'Financial Assistance Program',
    description: 'For students with financial difficulties.',
    about: 'The Financial Assistance Program supports eligible students who need assistance to continue their education.',
    eligibility: ['Must be currently enrolled at the college.', 'Must submit the required supporting documents.'],
    benefits: ['Financial assistance subject to review and approval.', 'Support to help continue academic studies.'],
    applicationStart: isoDaysFromNow(-30),
    applicationEnd: isoDaysFromNow(21),
    requiredDocuments: defaultDocuments,
    requiresGpa: false,
    maxGpa: null,
    deadline: isoDaysFromNow(21),
    status: 'Open',
  },
  {
    id: 'student-leadership-grant',
    name: 'Student Leadership Grant',
    description: 'Support for students demonstrating campus leadership.',
    about: 'The Student Leadership Grant recognizes students who contribute to campus life through leadership and service.',
    eligibility: ['Must be currently enrolled at the college.', 'Must demonstrate campus leadership or service.'],
    benefits: ['Grant support subject to scholarship approval.', 'Recognition of campus leadership and service.'],
    applicationStart: isoDaysFromNow(-30),
    applicationEnd: isoDaysFromNow(30),
    requiredDocuments: defaultDocuments,
    requiresGpa: false,
    maxGpa: null,
    deadline: isoDaysFromNow(30),
    status: 'Open',
  },
];

export const MOCK_APPLICATIONS: Application[] = [
  { id: 'application-academic', applicationId: 'CVLB-2026-00001', scholarshipId: 'academic-scholarship', scholarshipName: 'Academic Scholarship', status: 'Rejected', remarks: 'Incomplete supporting documents.', dateSubmitted: isoDaysFromNow(-2) },
  { id: 'application-financial-assistance', applicationId: 'CVLB-2026-00002', scholarshipId: 'financial-assistance-program', scholarshipName: 'Financial Assistance Program', status: 'Approved', remarks: '', dateSubmitted: isoDaysFromNow(-4) },
  { id: 'application-leadership', applicationId: 'CVLB-2026-00003', scholarshipId: 'student-leadership-grant', scholarshipName: 'Student Leadership Grant', status: 'Pending', remarks: '', dateSubmitted: isoDaysFromNow(-1) },
];

export const MOCK_NOTIFICATIONS: ScholarshipNotification[] = [
  { id: 'academic-application-update', title: 'Application update', message: 'Your Academic Scholarship application was rejected.', date: isoDaysFromNow(-2), read: false },
  { id: 'financial-application-approved', title: 'Application approved', message: 'Congratulations! Your Financial Assistance Program application has been approved.', date: isoDaysFromNow(-4), read: false },
  { id: 'leadership-application-received', title: 'Application received', message: 'Your Student Leadership Grant application is pending review.', date: isoDaysFromNow(-1), read: true },
];