export const CLAIM_REQUIREMENTS = "Present your Student ID or any one valid ID.";
// TODO: Replace with the current term from the academic calendar data.
export const CURRENT_TERM = "1st Semester, A.Y. 2026-2027";
export const COPY_OPTIONS = [
  { id: "regular", label: "Regular copy", fee: 0 },
  { id: "ctc", label: "With CTC stamp (Certified True Copy)", fee: 25 },
];

export const initialRequests = [
  {
    id: "registration",
    title: "Certificate of Registration",
    description: "Request for registration certificate",
    processingTime: "3 working days",
    copyOptions: COPY_OPTIONS,
    requirements: "Valid student ID or proof of identity.",
  },
  {
    id: "good-moral",
    title: "Good Moral Certificate",
    description: "Request for good moral certificate",
    processingTime: "5 working days",
    copyOptions: COPY_OPTIONS,
    requirements: "Valid student ID and completed request form.",
  },
  {
    id: "grades",
    title: "Report of Grades",
    description: "Request for report of grades",
    processingTime: "3 working days",
    copyOptions: COPY_OPTIONS,
    requirements: "Valid student ID.",
  },
  {
    id: "other",
    title: "Other Registrar Requests",
    description: "Request for other documents",
    processingTime: "5 working days",
    feeNote: "Fee: to be confirmed",
    requirements: "Specify the requested document and provide supporting details.",
  },
];

export const initialNotifications = [
  { id: "registration", message: "Your registration request is being processed.", date: "Dec 16, 2026" },
  {
    id: "grades",
    message: `Your Report of Grades (Regular copy) is ready for claiming. ${CLAIM_REQUIREMENTS}`,
    date: "Mar 25, 2026",
  },
  { id: "enrollment", message: "Enrollment status has been updated.", date: "Mar 25, 2026" },
  { id: "documents", message: "Registrar office has a new announcement.", date: "Mar 25, 2026" },
];

export const initialSubjects = [
  { id: "cpe-401l", code: "CPE 401L", name: "Embedded Systems Lab", units: "1.0" },
  { id: "cpe-401", code: "CPE 401", name: "Embedded Systems", units: "3.0" },
  { id: "cpe-403", code: "CPE 403", name: "Elective 3", units: "3.0" },
  { id: "cpe-405l", code: "CPE 405L", name: "Digital Signal Processing Lab", units: "1.0" },
  { id: "cpe-405", code: "CPE 405", name: "Digital Signal Processing", units: "3.0" },
  { id: "cpe-404d", code: "CPE 404D", name: "CPE Practice and Design 1", units: "1.0" },
  {
    id: "cpe-402l",
    code: "CPE 402L",
    name: "Computer Architecture and Organization Lab",
    units: "1.0",
  },
];

export const availableSubjects = [
  { id: "cpe-406", code: "CPE 406", name: "Computer Networks", units: "3.0" },
  { id: "cpe-407l", code: "CPE 407L", name: "Computer Networks Laboratory", units: "1.0" },
  { id: "cpe-408", code: "CPE 408", name: "Embedded Systems Design", units: "3.0" },
];
