/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FieldOption = { value: string; label: string };

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'segmented' // pill toggle, e.g. 1st / 2nd semester
  | 'file'
  | 'date';

export interface FieldConfig {
  name: string; // key in the submitted values -> good column/jsonb key for Supabase
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean; // default true
  options?: FieldOption[];
  min?: number;
  max?: number;
  accept?: string;
}

export type RequestFormId =
  | 'report-of-grades'
  | 'certificate-of-registration'
  | 'good-moral-certificate'
  | 'other-registrar-request';

export interface RequestFormConfig {
  id: RequestFormId;
  title: string;
  requestType: string; // e.g. save to a `request_type` column later
  fields: FieldConfig[];
  confirmLabel?: string;
}

export type FormValues = Record<string, string | File | null>;

export interface Subject {
  code: string;
  title: string;
  units: number;
  day: string;
  time: string;
}

export type SubjectChangeKind = 'add' | 'remove';

/* ------------------------------------------------------------------ */
/*  Shared fields                                                      */
/* ------------------------------------------------------------------ */

const thisYear = new Date().getFullYear();

/** Last 5 academic years, newest first: "2026 - 2027", "2025 - 2026" ... */
const academicYearOptions = Array.from({ length: 5 }, (_, i) => {
  const start = thisYear - i;
  return { value: `${start}-${start + 1}`, label: `${start} - ${start + 1}` };
});

const academicYear: FieldConfig = {
  name: 'academic_year',
  label: 'Academic Year',
  type: 'select',
  placeholder: 'Select academic year',
  options: academicYearOptions,
};

const semester: FieldConfig = {
  name: 'semester',
  label: 'Semester',
  type: 'segmented',
  options: [
    { value: '1st', label: '1st Semester' },
    { value: '2nd', label: '2nd Semester' },
  ],
};

const purpose: FieldConfig = {
  name: 'purpose',
  label: 'Purpose of Request',
  type: 'text',
  placeholder: 'Enter purpose of request...',
};

const copies: FieldConfig = {
  name: 'copies',
  label: 'Number of Copies',
  type: 'number',
  placeholder: '1, 2, 3',
  min: 1,
  max: 10,
};

/* ------------------------------------------------------------------ */
/*  One entry per request type — add a new card by adding an entry     */
/* ------------------------------------------------------------------ */

export const requestForms: Record<RequestFormId, RequestFormConfig> = {
  'report-of-grades': {
    id: 'report-of-grades',
    title: 'Report of Grades',
    requestType: 'report_of_grades',
    fields: [academicYear, semester, purpose, copies],
  },

  'certificate-of-registration': {
    id: 'certificate-of-registration',
    title: 'Certificate of Registration',
    requestType: 'certificate_of_registration',
    fields: [academicYear, semester, purpose, copies],
  },

  'good-moral-certificate': {
    id: 'good-moral-certificate',
    title: 'Good Moral Certificate',
    requestType: 'good_moral_certificate',
    fields: [
      purpose,
      {
        name: 'purpose_details',
        label: 'Purpose Details',
        type: 'text',
        placeholder: 'Please specify where the certificate will be used...',
      },
      copies,
    ],
  },

  'other-registrar-request': {
    id: 'other-registrar-request',
    title: 'Other Registrar Request',
    requestType: 'other',
    fields: [
      { name: 'request_type', label: 'Request Type', type: 'text', placeholder: 'Enter type of request...' },
      { name: 'request_details', label: 'Request Details', type: 'text', placeholder: 'Please specify what you need...' },
      { name: 'attachment', label: 'Attachment/s (optional)', type: 'file', required: false, accept: '.pdf,.png,.jpg,.jpeg,.doc,.docx' },
      { name: 'preferred_date', label: 'Preferred Date', type: 'date' },
    ],
  },
};

/* Reasons shown in the Add / Remove subject confirm cards ("Other" is added automatically) */
export const subjectReasons: Record<SubjectChangeKind, string[]> = {
  add: [
    'Subject was not included in my original enrollment',
    'To follow my recommended curriculum',
    'Schedule adjustment',
  ],
  remove: ['Schedule Conflict', 'Change Subject', 'Prerequisite Concern'],
};