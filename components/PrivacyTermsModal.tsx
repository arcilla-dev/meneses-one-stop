"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  EDIT THESE BEFORE USING                                            */
/* ------------------------------------------------------------------ */
const SYSTEM_NAME = "Meneses Campus One-Stop";
const SCHOOL_NAME = "Bulacan State University – Meneses Campus";
const CONTACT_EMAIL = "your-contact-email@example.edu.ph"; // TODO: office or person who answers privacy concerns
const LAST_UPDATED = "January 1, 2026"; // TODO: set the real date

type Tab = "privacy" | "terms";
interface Section {
  heading: string;
  body?: string[]; // paragraphs
  items?: string[]; // bullet points
}

/* ------------------------------ Privacy ------------------------------ */
const PRIVACY: Section[] = [
  {
    heading: "1. About this policy",
    body: [
      `${SYSTEM_NAME} is an online system of ${SCHOOL_NAME} that lets students send requests to the Registrar, Infirmary, Local Student Council (LSC) and Scholarship offices. This policy explains what personal information we collect, why, and how it is handled, in line with the Data Privacy Act of 2012 (Republic Act No. 10173).`,
    ],
  },
  {
    heading: "2. What we collect",
    items: [
      "Account and profile: full name, email, student number, program, year and section, gender, age, and your profile photo.",
      "Registrar: document requests (such as COR, grades, good moral certificate), their details and attachments, and add/remove subject requests with your reasons.",
      "Infirmary: appointment requests, including the service, date, time and any remarks you write. Remarks may contain health information, which is sensitive personal information.",
      "LSC: print requests, including the files you upload, paper size, color, layout, page count and notes.",
      "Scholarship: applications, including your GPA, contact details and the documents you upload.",
      "Notifications and announcements you receive or mark as read.",
    ],
  },
  {
    heading: "3. Why we use it",
    items: [
      "To identify you and show your own records.",
      "To let the offices review, approve, reject and process your requests.",
      "To send you updates about your requests inside the system.",
      "To keep records of transactions for school processing.",
    ],
    body: ["We do not sell your information and we do not use it for advertising."],
  },
  {
    heading: "4. Who can see it",
    items: [
      "You can see your own records.",
      "Authorized administrators of the school can see the requests and student details needed to process them.",
      "Your profile photo can be opened by anyone who has its link, because profile photos are stored in a publicly readable folder. Do not use a photo you want to keep private.",
      "The system runs on Supabase, a cloud service provider that stores the data for us.",
    ],
  },
  {
    heading: "5. Security",
    body: [
      "Access to records is controlled by account roles. Uploaded files are kept in private storage and are opened only through temporary links. Even so, no system is completely secure, so please keep your password private and log out on shared computers.",
    ],
  },
  {
    heading: "6. How long we keep it",
    body: [
      "We keep your information only as long as it is needed to process your requests and meet school record-keeping needs. You may ask us to correct or remove information that is no longer needed, subject to school rules and legal requirements.",
    ],
  },
  {
    heading: "7. Your rights",
    body: ["Under the Data Privacy Act, you have the right to:"],
    items: [
      "Be informed about how your data is used.",
      "Access the personal information we hold about you.",
      "Correct inaccurate or outdated information (you can edit your profile in Profile and Settings).",
      "Object to processing, or ask for blocking or removal where allowed by law.",
      "Be compensated for damages caused by unlawful use of your data.",
      "File a complaint with the National Privacy Commission (privacy.gov.ph).",
    ],
  },
  {
    heading: "8. Changes and contact",
    body: [
      "We may update this policy. The date at the top shows the latest version. For questions or requests about your data, contact: " + CONTACT_EMAIL + ".",
    ],
  },
];

/* ------------------------------- Terms ------------------------------- */
const TERMS: Section[] = [
  {
    heading: "1. Acceptance",
    body: [
      `By creating an account or using ${SYSTEM_NAME}, you agree to these Terms and to the Privacy Policy. If you do not agree, please do not use the system.`,
    ],
  },
  {
    heading: "2. Who may use it",
    body: [
      `The system is for currently enrolled students of ${SCHOOL_NAME} and for authorized school staff. Each person may have only one account.`,
    ],
  },
  {
    heading: "3. Your account",
    items: [
      "Keep your login details private. You are responsible for activity under your account.",
      "Tell us right away if you think someone else has used your account.",
      "Keep your profile information accurate and up to date.",
    ],
  },
  {
    heading: "4. Using the services",
    items: [
      "Give true and complete information in every request.",
      "Upload only files you have the right to share, and only files that are related to your request.",
      "Do not upload files that contain viruses or harmful, illegal or offensive content.",
      "Do not try to access other students' records or parts of the system you are not allowed to use.",
      "Do not submit fake, duplicate or abusive requests.",
    ],
  },
  {
    heading: "5. Requests are reviewed, not guaranteed",
    body: [
      "Submitting a request does not mean it will be approved. Each office reviews requests under its own rules and may approve, reject or ask for more information. Status updates appear in the system and in your notifications.",
    ],
  },
  {
    heading: "6. Office-specific notes",
    items: [
      "Registrar: document and subject requests follow school policy. Approval of an add or remove request changes your enrolled subjects.",
      "Infirmary: appointments are subject to clinic availability. The system is not for emergencies. In an emergency, go to the nearest clinic or hospital or call emergency services.",
      "LSC: print fees are computed from the posted rates. Prints must be claimed within the LSC's office hours and rules.",
      "Scholarship: submitting an application does not guarantee an award. Programs may have GPA, document and deadline requirements.",
    ],
  },
  {
    heading: "7. Availability",
    body: [
      "We try to keep the system running, but it may be unavailable for maintenance or because of problems we do not control. The system is provided as is, and the school is not responsible for losses caused by downtime or by wrong information you provide.",
    ],
  },
  {
    heading: "8. Suspension",
    body: [
      "The school may limit or suspend an account that breaks these Terms or school rules, and may cancel requests that contain false information.",
    ],
  },
  {
    heading: "9. Changes and governing law",
    body: [
      "We may update these Terms. Continuing to use the system after an update means you accept the new version. These Terms are governed by the laws of the Republic of the Philippines.",
      "Questions? Contact: " + CONTACT_EMAIL + ".",
    ],
  },
];

/* ------------------------------ Component ----------------------------- */

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

export default function PrivacyTermsModal({ open, onClose, initialTab = "privacy" }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, initialTab]);

  if (!open) return null;

  const sections = tab === "privacy" ? PRIVACY : TERMS;
  const title = tab === "privacy" ? "Privacy Policy" : "Terms & Conditions";

  const tabClass = (t: Tab) =>
    `flex-1 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
      tab === t ? "bg-[#48305d] text-white" : "bg-[#e8c3da] text-[#48305d] hover:bg-[#d8a6c7]"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-terms-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#956887] bg-[#f4d4e7] p-5 text-[#392641] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="privacy-terms-title" className="text-2xl font-bold text-[#48305d]" style={{ fontFamily: "Georgia, serif" }}>
              {title}
            </h2>
            <p className="text-xs text-[#684f6c]">Last updated: {LAST_UPDATED}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-[#684f6c] hover:bg-[#e8c3da] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-2" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "privacy"} onClick={() => setTab("privacy")} className={tabClass("privacy")}>
            Privacy Policy
          </button>
          <button type="button" role="tab" aria-selected={tab === "terms"} onClick={() => setTab("terms")} className={tabClass("terms")}>
            Terms &amp; Conditions
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-5 overflow-y-auto pr-2 text-sm leading-relaxed">
          {sections.map((s) => (
            <section key={s.heading}>
              <h3 className="font-bold text-[#48305d]">{s.heading}</h3>
              {s.body?.map((p) => (
                <p key={p} className="mt-1">
                  {p}
                </p>
              ))}
              {s.items && (
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#48305d] px-6 py-2 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}