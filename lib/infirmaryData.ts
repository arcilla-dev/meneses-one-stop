import { ClipboardList, FileText, HeartPulse, Smile, Stethoscope, type LucideIcon } from 'lucide-react';
import { formatDisplayDate, toDateInputValue } from './infirmaryUtils';

/* ---------- types ---------- */

export type AppointmentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';

export type Appointment = {
  id: string;
  service: string;
  date: string; // ISO "YYYY-MM-DD"
  timeStart: string; // "09:30 AM"
  timeEnd: string;
  status: AppointmentStatus;
  remarks: string;
  dateSubmitted?: string;
};

/** What the Request Schedule form hands to the page */
export type AppointmentDraft = Pick<Appointment, 'service' | 'date' | 'timeStart' | 'timeEnd' | 'remarks'>;

export type InfirmaryNotification = {
  id: string;
  message: string;
  date: string;
  read: boolean;
  type: string;
};

/* ---------- constants ---------- */

export const CLAIM_REQUIREMENTS = 'Present your Student ID or any one valid ID.';
/** "Present your X." -> "bring your X" so it reads correctly inside a sentence */
export const CLAIM_REMINDER = CLAIM_REQUIREMENTS.replace(/^Present your /, 'bring your ').replace(/\.$/, '');

export const SERVICES = ['Medical Consultation', 'Vital Signs Check', 'Dental Check-up', 'Medical Certificate', 'Other'];

export const CLINIC_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

export const TIME_SLOTS = [
  { start: '08:00 AM', end: '09:00 AM' },
  { start: '09:00 AM', end: '10:00 AM' },
  { start: '10:00 AM', end: '11:00 AM' },
  { start: '11:00 AM', end: '12:00 PM' },
  { start: '01:00 PM', end: '02:00 PM' },
  { start: '02:00 PM', end: '03:00 PM' },
  { start: '03:00 PM', end: '04:00 PM' },
];

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  'Medical Consultation': ClipboardList,
  'Vital Signs Check': HeartPulse,
  'Dental Check-up': Smile, // lucide-react has no "Toothbrush" icon
  'Medical Certificate': FileText,
  Other: Stethoscope,
};

export const statusStyles: Record<AppointmentStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-200 text-gray-700',
  Completed: 'bg-purple-200 text-purple-800',
};

/* ---------- mock data (replace with Supabase queries) ---------- */

function isoAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'appointment-medical-approved', service: 'Medical Consultation', date: '2026-10-05', timeStart: '09:30 AM', timeEnd: '10:30 AM', status: 'Approved', remarks: '' },
  { id: 'appointment-vitals-pending', service: 'Vital Signs Check', date: '2026-10-05', timeStart: '09:30 AM', timeEnd: '10:30 AM', status: 'Pending', remarks: '' },
  { id: 'appointment-dental-rejected', service: 'Dental Check-up', date: '2026-10-05', timeStart: '09:30 AM', timeEnd: '10:30 AM', status: 'Rejected', remarks: 'Dentist unavailable on this date. Please choose another schedule.' },
  { id: 'appointment-consultation-upcoming', service: 'Medical Consultation', date: isoAfterDays(3), timeStart: '09:30 AM', timeEnd: '10:30 AM', status: 'Approved', remarks: '' },
  { id: 'appointment-vitals-upcoming', service: 'Vital Signs Check', date: isoAfterDays(5), timeStart: '09:30 AM', timeEnd: '10:30 AM', status: 'Pending', remarks: '' },
];

export const mockNotifications: InfirmaryNotification[] = [
  { id: 'consultation-approved', message: 'Your Medical Consultation on Oct 05, 2026 at 09:30 AM has been approved.', date: formatDisplayDate('2026-10-05'), read: false, type: 'approved' },
  { id: 'vitals-pending', message: 'Your Vital Signs Check on Oct 05, 2026 at 09:30 AM is pending approval.', date: formatDisplayDate('2026-10-05'), read: false, type: 'pending' },
  { id: 'dental-rejected', message: 'Your Dental Check-up on Oct 05, 2026 at 09:30 AM was rejected.', date: formatDisplayDate('2026-10-05'), read: true, type: 'rejected' },
  { id: 'medical-certificate-ready', message: `Your Medical Certificate is ready for claiming. ${CLAIM_REQUIREMENTS}`, date: formatDisplayDate('2026-10-05'), read: true, type: 'certificate' },
];