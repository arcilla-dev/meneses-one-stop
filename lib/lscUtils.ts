import {
  PRINT_RATES,
  type ColorId,
  type PaperSizeId,
  type PrintRequest,
} from "./lscData";

// ---------- Money ----------

/** Estimate only. TODO (Supabase): compute the real bill server-side (DB function or trigger). */
export function computeBill(
  paperSize: PaperSizeId,
  color: ColorId,
  pages: number | string,
): number {
  const rate = PRINT_RATES[paperSize]?.[color];
  const pageCount = Number(pages);

  if (
    typeof rate !== "number" ||
    !Number.isFinite(rate) ||
    !Number.isFinite(pageCount) ||
    !Number.isInteger(pageCount) ||
    pageCount < 0
  ) {
    return 0;
  }

  return rate * pageCount;
}

export function formatPeso(amount: number | string | null | undefined): string {
  const value = Number(amount);
  return (Number.isFinite(value) ? value : 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });
}

// ---------- Dates (stored as ISO "YYYY-MM-DD", formatted only for display) ----------

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ISO date `days` from today (negative = past). */
export function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/** Newest first. ISO strings sort correctly as plain text. */
export function byDateDesc<T>(getDate: (item: T) => string) {
  return (a: T, b: T) => getDate(b).localeCompare(getDate(a));
}

// ---------- Request numbers ----------

/** Client-side preview only. TODO (Supabase): generate this in the database (sequence + default/trigger). */
export function nextRequestNumber(
  requests: PrintRequest[],
  year: number,
): string {
  const pattern = new RegExp(`^LSC-${year}-(\\d{5})$`);
  const next =
    requests.reduce((max, r) => {
      const match = r.requestNumber.match(pattern);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;
  return `LSC-${year}-${String(next).padStart(5, "0")}`;
}