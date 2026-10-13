import type { RequestFormId, Subject } from './requestForms';

/* ---------- types ---------- */

export type NotificationData = {
  id: string;
  message: string;
  date: string;
  isRead?: boolean;
};

export type SubmittedRequest = {
  id: string;
  requestType: string;
  title: string;
  status: 'Pending' | 'Processing' | 'Ready for claiming';
};

export type SubjectChange = {
  id: string;
  kind: 'add' | 'remove';
  subjectCode: string;
  subjectTitle: string;
  reason: string;
  status: 'Pending';
};

/* ---------- constants ---------- */

export const CLAIM_REQUIREMENTS = 'Present your Student ID or any one valid ID.';
// TODO: Replace with the current term from the academic calendar data.
export const CURRENT_TERM = '1st Semester, A.Y. 2026-2027';

/** Card text for the Requests tab. The form fields themselves live in lib/requestForms.ts */
export const requestCards: Record<RequestFormId, { description: string; processingTime: string }> = {
  'certificate-of-registration': {
    description: 'Request for registration certificate',
    processingTime: '3 working days',
  },
  'good-moral-certificate': {
    description: 'Request for good moral certificate',
    processingTime: '5 working days',
  },
  'report-of-grades': {
    description: 'Request for report of grades',
    processingTime: '3 working days',
  },
  'other-registrar-request': {
    description: 'Request for other documents',
    processingTime: '5 working days',
  },
};

/* ---------- mock data (replace with Supabase queries) ---------- */

export const initialNotifications: NotificationData[] = [
  { id: 'registration', message: 'Your registration request is being processed.', date: 'Mar 25, 2026' },
  {
    id: 'grades',
    message: `Your Report of Grades is ready for claiming. ${CLAIM_REQUIREMENTS}`,
    date: 'Mar 25, 2026',
  },
  { id: 'enrollment', message: 'Enrollment status has been updated.', date: 'Mar 25, 2026' },
  { id: 'documents', message: 'Registrar office has a new announcement.', date: 'Mar 25, 2026' },
];

// day / time are placeholders until the real schedule comes from the database
export const initialSubjects: Subject[] = [
  { code: 'CPE 401L', title: 'Embedded Systems Lab', units: 1, day: 'Mon', time: '7:00 AM - 10:00 AM' },
  { code: 'CPE 401', title: 'Embedded Systems', units: 3, day: 'Tue', time: '7:00 AM - 10:00 AM' },
  { code: 'CPE 403', title: 'Elective 3', units: 3, day: 'Wed', time: '1:00 PM - 4:00 PM' },
  { code: 'CPE 405L', title: 'Digital Signal Processing Lab', units: 1, day: 'Thu', time: '7:00 AM - 10:00 AM' },
  { code: 'CPE 405', title: 'Digital Signal Processing', units: 3, day: 'Fri', time: '7:00 AM - 10:00 AM' },
  { code: 'CPE 404D', title: 'CPE Practice and Design 1', units: 1, day: 'Sat', time: '8:00 AM - 11:00 AM' },
  { code: 'CPE 402L', title: 'Computer Architecture and Organization Lab', units: 1, day: 'Sat', time: '1:00 PM - 4:00 PM' },
];

export const availableSubjects: Subject[] = [
  { code: 'CPE 406', title: 'Computer Networks', units: 3, day: 'Mon', time: '1:00 PM - 4:00 PM' },
  { code: 'CPE 407L', title: 'Computer Networks Laboratory', units: 1, day: 'Tue', time: '1:00 PM - 4:00 PM' },
  { code: 'CPE 408', title: 'Embedded Systems Design', units: 3, day: 'Thu', time: '1:00 PM - 4:00 PM' },
];