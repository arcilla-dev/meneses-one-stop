import {
  ClipboardList,
  FileText,
  HeartPulse,
  Stethoscope,
  Toothbrush,
} from "lucide-react";

export const CLAIM_REQUIREMENTS =
  "Present your Student ID or any one valid ID.";

export const SERVICES = [
  "Medical Consultation",
  "Vital Signs Check",
  "Dental Check-up",
  "Medical Certificate",
  "Other",
];

export const CLINIC_DAYS = [1, 2, 3, 4, 5];

export const TIME_SLOTS = [
  { start: "08:00 AM", end: "09:00 AM" },
  { start: "09:00 AM", end: "10:00 AM" },
  { start: "10:00 AM", end: "11:00 AM" },
  { start: "11:00 AM", end: "12:00 PM" },
  { start: "01:00 PM", end: "02:00 PM" },
  { start: "02:00 PM", end: "03:00 PM" },
  { start: "03:00 PM", end: "04:00 PM" },
];

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function dateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export const SERVICE_ICONS = {
  "Medical Consultation": ClipboardList,
  "Vital Signs Check": HeartPulse,
  "Dental Check-up": Toothbrush,
  "Medical Certificate": FileText,
  Other: Stethoscope,
};

export const MOCK_APPOINTMENTS = [
  {
    id: "appointment-medical-approved",
    service: "Medical Consultation",
    date: "Oct 05, 2026",
    timeStart: "09:30 AM",
    timeEnd: "10:30 AM",
    status: "Approved",
    remarks: "",
  },
  {
    id: "appointment-vitals-pending",
    service: "Vital Signs Check",
    date: "Oct 05, 2026",
    timeStart: "09:30 AM",
    timeEnd: "10:30 AM",
    status: "Pending",
    remarks: "",
  },
  {
    id: "appointment-dental-rejected",
    service: "Dental Check-up",
    date: "Oct 05, 2026",
    timeStart: "09:30 AM",
    timeEnd: "10:30 AM",
    status: "Rejected",
    remarks: "Dentist unavailable on this date. Please choose another schedule.",
  },
  {
    id: "appointment-consultation-upcoming",
    service: "Medical Consultation",
    date: dateAfterDays(3),
    timeStart: "09:30 AM",
    timeEnd: "10:30 AM",
    status: "Approved",
    remarks: "",
  },
  {
    id: "appointment-vitals-upcoming",
    service: "Vital Signs Check",
    date: dateAfterDays(5),
    timeStart: "09:30 AM",
    timeEnd: "10:30 AM",
    status: "Pending",
    remarks: "",
  },
];

export const mockNotifications = [
  {
    id: "consultation-approved",
    message: "Your Medical Consultation on Oct 05, 2026 at 09:30 AM has been approved.",
    date: "Oct 05, 2026",
    read: false,
    type: "approved",
  },
  {
    id: "vitals-pending",
    message: "Your Vital Signs Check on Oct 05, 2026 at 09:30 AM is pending approval.",
    date: "Oct 05, 2026",
    read: false,
    type: "pending",
  },
  {
    id: "dental-rejected",
    message: "Your Dental Check-up on Oct 05, 2026 at 09:30 AM was rejected.",
    date: "Oct 05, 2026",
    read: true,
    type: "rejected",
  },
  {
    id: "medical-certificate-ready",
    message:
      "Your Medical Certificate is ready for claiming. Present your Student ID or any one valid ID.",
    date: "Oct 05, 2026",
    read: true,
    type: "certificate",
  },
];
