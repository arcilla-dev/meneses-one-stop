// Shared by proxy.ts (server), the login redirect, and the client context/sidebar.
// Keep this file free of browser-only code.

export const OFFICES = ["registrar", "infirmary", "scholarship", "lsc"] as const;
export type Office = (typeof OFFICES)[number];

export const isOffice = (v: unknown): v is Office =>
  typeof v === "string" && (OFFICES as readonly string[]).includes(v);

// Where each office admin lands: the first page of their office.
export const OFFICE_HOME: Record<Office, string> = {
  registrar: "/admin/registrar/document-requests",
  infirmary: "/admin/infirmary/appointment-requests",
  scholarship: "/admin/scholarship/scholarship-applications",
  lsc: "/admin/lsc/lsc-service-requests",
};

// Landing page after login, by role and office.
export function homeFor(
  role: string | null | undefined,
  office: string | null | undefined
): string {
  if (role === "admin") return isOffice(office) ? OFFICE_HOME[office] : "/admin";
  if (role === "superadmin") return "/admin";
  return "/student";
}

// "/admin/lsc/lsc-services" -> "lsc". Anything that is not an office page -> null.
export function officeOfPath(pathname: string): Office | null {
  if (!pathname.startsWith("/admin/")) return null;
  const seg = pathname.split("/")[2];
  return isOffice(seg) ? seg : null;
}