// Shared by proxy.ts (server), the login redirect, and the client context/sidebar.
// Keep this file free of browser-only code.

export const OFFICES = ["registrar", "infirmary", "scholarship", "lsc"] as const;
export type Office = (typeof OFFICES)[number];

export const isOffice = (v: unknown): v is Office =>
  typeof v === "string" && (OFFICES as readonly string[]).includes(v);

// Where each office admin lands: the first page of their office.
export const OFFICE_HOME: Record<Office, string> = {
  registrar: "/adminv2/registrar/document-requests",
  infirmary: "/adminv2/infirmary/appointment-requests",
  scholarship: "/adminv2/scholarship/scholarship-applications",
  lsc: "/adminv2/lsc/lsc-service-requests",
};

// Landing page after login, by role and office.
export function homeFor(
  role: string | null | undefined,
  office: string | null | undefined
): string {
  if (role === "admin") return isOffice(office) ? OFFICE_HOME[office] : "/adminv2";
  if (role === "superadmin") return "/adminv2";
  return "/studentview";
}

// "/adminv2/lsc/lsc-services" -> "lsc". Anything that is not an office page -> null.
export function officeOfPath(pathname: string): Office | null {
  if (!pathname.startsWith("/adminv2/")) return null;
  const seg = pathname.split("/")[2];
  return isOffice(seg) ? seg : null;
}